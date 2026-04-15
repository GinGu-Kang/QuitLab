import fs from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';

import { DEFAULT_MASTER_DATA, toDraftMasterData } from '@/lib/master-data-defaults';
import { invalidatePublishedMasterDataCache } from '@/lib/master-data';
import { buildPublishedMasterData, validateMasterDataDraft } from '@/lib/master-data-validation';
import { canUsePrisma, prisma } from '@/lib/prisma';
import { readStorage, writeStorage } from '@/lib/repository';
import { createId } from '@/lib/utils';
import type {
  AdminAuditLogEntry,
  DraftStartupItem,
  MasterDataDraftPayload,
  MasterDataReleaseRecord,
  MasterDataReleaseSummary,
  MasterDataValidationReport,
  PublishedMasterData,
  StoredMasterDataRelease
} from '@/types';

const BASELINE_VERSION = 'v1-from-excel';
const BACKUP_DIR = path.join(process.cwd(), 'backups', 'master-data', 'releases');
let masterDataSchemaPromise: Promise<boolean> | null = null;

type DraftReleaseDetail = {
  release: MasterDataReleaseRecord;
  draftData: MasterDataDraftPayload;
};

type CatalogMutationInput = Omit<DraftStartupItem, 'draftId' | 'releaseId' | 'id' | 'sourceItemId'> & {
  id?: number;
  sourceItemId?: number | null;
};

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toNullablePrismaJson(value: unknown) {
  if (value == null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

function shouldFallbackToStorage(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ['P2021', 'P2022'].includes(error.code);
}

async function hasMasterDataSchema() {
  if (!canUsePrisma() || !prisma) return false;
  if (!masterDataSchemaPromise) {
    masterDataSchemaPromise = prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND lower(table_name) = lower('MasterDataRelease')
      ) AS "exists"
    `
      .then((rows) => Boolean(rows[0]?.exists))
      .catch(() => false);
  }
  return masterDataSchemaPromise;
}

function toReleaseRecord(release: {
  id: string;
  version: string;
  status: string;
  snapshotJson: unknown;
  baseReleaseId: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: Date | string;
  publishedAt: Date | string | null;
}): MasterDataReleaseRecord {
  return {
    id: release.id,
    version: release.version,
    status: release.status as MasterDataReleaseRecord['status'],
    snapshotJson: (release.snapshotJson as PublishedMasterData | null) ?? null,
    baseReleaseId: release.baseReleaseId ?? null,
    notes: release.notes ?? null,
    createdById: release.createdById ?? null,
    createdAt: typeof release.createdAt === 'string' ? release.createdAt : release.createdAt.toISOString(),
    publishedAt: release.publishedAt ? (typeof release.publishedAt === 'string' ? release.publishedAt : release.publishedAt.toISOString()) : null
  };
}

function summarizeRelease(detail: DraftReleaseDetail): MasterDataReleaseSummary {
  const activeItemCount = detail.draftData.startupItems.filter((item) => item.rowStatus === 'active').length;
  return {
    ...detail.release,
    itemCount: detail.draftData.startupItems.length,
    activeItemCount
  };
}

async function writeReleaseBackup(snapshot: PublishedMasterData) {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.writeFile(
      path.join(BACKUP_DIR, `${snapshot.version}.json`),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      'utf8'
    );
  } catch {
    // Runtime backup creation is best-effort because some deployments use ephemeral filesystems.
  }
}

async function appendAuditLog(entry: Omit<AdminAuditLogEntry, 'id' | 'createdAt'>) {
  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: entry.adminUserId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        beforeJson: toNullablePrismaJson(entry.beforeJson),
        afterJson: toNullablePrismaJson(entry.afterJson)
      }
    });
    return;
  }

  const storage = await readStorage();
  storage.adminAuditLogs.unshift({
    id: createId('audit'),
    adminUserId: entry.adminUserId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    beforeJson: entry.beforeJson,
    afterJson: entry.afterJson,
    createdAt: new Date().toISOString()
  });
  await writeStorage(storage);
}

function createStoredRelease(params: {
  id?: string;
  version: string;
  status: StoredMasterDataRelease['status'];
  draftData: MasterDataDraftPayload;
  baseReleaseId?: string | null;
  notes?: string | null;
  createdById?: string | null;
  publishedAt?: string | null;
}): StoredMasterDataRelease {
  const id = params.id ?? createId('release');
  const releaseDraftData: MasterDataDraftPayload = {
    ...cloneValue(params.draftData),
    startupItems: params.draftData.startupItems.map((item) => ({
      ...cloneValue(item),
      releaseId: id
    }))
  };
  const snapshotJson =
    params.status === 'published'
      ? buildPublishedMasterData({
          releaseId: id,
          version: params.version,
          draftData: releaseDraftData
        })
      : null;

  return {
    id,
    version: params.version,
    status: params.status,
    snapshotJson,
    baseReleaseId: params.baseReleaseId ?? null,
    notes: params.notes ?? null,
    createdById: params.createdById ?? null,
    createdAt: new Date().toISOString(),
    publishedAt: params.publishedAt ?? (params.status === 'published' ? new Date().toISOString() : null),
    draftData: releaseDraftData
  };
}

async function ensureLocalBaselineRelease() {
  const storage = await readStorage();
  if (storage.masterDataReleases.length > 0) {
    return storage;
  }

  const baseline = createStoredRelease({
    version: BASELINE_VERSION,
    status: 'published',
    draftData: toDraftMasterData({
      ...DEFAULT_MASTER_DATA,
      releaseId: createId('release'),
      version: BASELINE_VERSION
    })
  });

  storage.masterDataReleases = [baseline];
  await writeStorage(storage);
  return storage;
}

async function loadDraftDataFromPrismaRelease(releaseId: string): Promise<MasterDataDraftPayload> {
  if (!prisma) {
    throw new Error('Prisma client is not available.');
  }

  const [startupItems, competencyQuestions, hardFilters, personalityQuestions, careerRows, competencyGuide] = await Promise.all([
    prisma.startupItemDraft.findMany({ where: { releaseId }, orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
    prisma.competencyQuestionDraft.findMany({ where: { releaseId }, orderBy: { sourceQuestionId: 'asc' } }),
    prisma.hardFilterDraft.findMany({ where: { releaseId }, orderBy: { sourceFilterId: 'asc' } }),
    prisma.personalityQuestionDraft.findMany({ where: { releaseId }, orderBy: { sourceQuestionId: 'asc' } }),
    prisma.careerSynergyDraft.findMany({ where: { releaseId }, orderBy: [{ careerKey: 'asc' }, { category: 'asc' }] }),
    prisma.competencyGuideDraft.findMany({ where: { releaseId }, orderBy: { sourceGuideKey: 'asc' } })
  ]);

  return {
    startupItems: startupItems.map((item) => ({
      draftId: item.id,
      releaseId: item.releaseId,
      sourceItemId: item.sourceItemId,
      rowStatus: item.rowStatus as DraftStartupItem['rowStatus'],
      id: item.sourceItemId ?? 0,
      category: item.category,
      name: item.name,
      coreSkills: item.coreSkills,
      investmentRange: item.investmentRange,
      investmentMin: item.investmentMin,
      investmentMax: item.investmentMax,
      competencyScores: item.competencyScores as unknown as DraftStartupItem['competencyScores'],
      operationType: item.operationType,
      requiredStaff: item.requiredStaff,
      weekendWork: item.weekendWork,
      workLifeBalance: item.workLifeBalance,
      seasonality: item.seasonality,
      requiredLicense: item.requiredLicense,
      avgMonthlyRevenue: item.avgMonthlyRevenue,
      operatingMargin: item.operatingMargin,
      breakeven: item.breakeven,
      competitionLevel: item.competitionLevel,
      differentiationRoom: item.differentiationRoom,
      closureRate: item.closureRate,
      growthPotential: item.growthPotential,
      entryBarrier: item.entryBarrier
    })),
    competencyQuestions: competencyQuestions.map((row) => row.payload as unknown as MasterDataDraftPayload['competencyQuestions'][number]),
    hardFilters: hardFilters.map((row) => row.payload as unknown as MasterDataDraftPayload['hardFilters'][number]),
    personalityQuestions: personalityQuestions.map((row) => row.payload as unknown as MasterDataDraftPayload['personalityQuestions'][number]),
    careerSynergy: careerRows.reduce<MasterDataDraftPayload['careerSynergy']>((acc, row) => {
      if (!acc[row.careerKey as keyof typeof acc]) {
        acc[row.careerKey as keyof typeof acc] = {} as (typeof acc)[keyof typeof acc];
      }
      acc[row.careerKey as keyof typeof acc][row.category] = row.score;
      return acc;
    }, {} as MasterDataDraftPayload['careerSynergy']),
    competencyGuide: competencyGuide.map((row) => row.payload as unknown as MasterDataDraftPayload['competencyGuide'][number])
  };
}

async function saveDraftDataToPrisma(releaseId: string, draftData: MasterDataDraftPayload) {
  if (!prisma) {
    throw new Error('Prisma client is not available.');
  }

  await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.startupItemDraft.deleteMany({ where: { releaseId } }),
      tx.competencyQuestionDraft.deleteMany({ where: { releaseId } }),
      tx.hardFilterDraft.deleteMany({ where: { releaseId } }),
      tx.personalityQuestionDraft.deleteMany({ where: { releaseId } }),
      tx.careerSynergyDraft.deleteMany({ where: { releaseId } }),
      tx.competencyGuideDraft.deleteMany({ where: { releaseId } })
    ]);

    if (draftData.startupItems.length > 0) {
      await tx.startupItemDraft.createMany({
        data: draftData.startupItems.map((item) => ({
          id: item.draftId,
          releaseId,
          sourceItemId: item.id,
          rowStatus: item.rowStatus,
          category: item.category,
          name: item.name,
          coreSkills: item.coreSkills,
          investmentRange: item.investmentRange,
          investmentMin: item.investmentMin,
          investmentMax: item.investmentMax,
          competencyScores: item.competencyScores as unknown as Prisma.InputJsonValue,
          operationType: item.operationType,
          requiredStaff: item.requiredStaff,
          weekendWork: item.weekendWork,
          workLifeBalance: item.workLifeBalance,
          seasonality: item.seasonality,
          requiredLicense: item.requiredLicense,
          avgMonthlyRevenue: item.avgMonthlyRevenue,
          operatingMargin: item.operatingMargin,
          breakeven: item.breakeven,
          competitionLevel: item.competitionLevel,
          differentiationRoom: item.differentiationRoom,
          closureRate: item.closureRate,
          growthPotential: item.growthPotential,
          entryBarrier: item.entryBarrier
        }))
      });
    }

    if (draftData.competencyQuestions.length > 0) {
      await tx.competencyQuestionDraft.createMany({
        data: draftData.competencyQuestions.map((payload) => ({
          releaseId,
          sourceQuestionId: payload.id,
          payload: payload as unknown as Prisma.InputJsonValue
        }))
      });
    }

    if (draftData.hardFilters.length > 0) {
      await tx.hardFilterDraft.createMany({
        data: draftData.hardFilters.map((payload) => ({
          releaseId,
          sourceFilterId: payload.id,
          payload: payload as unknown as Prisma.InputJsonValue
        }))
      });
    }

    if (draftData.personalityQuestions.length > 0) {
      await tx.personalityQuestionDraft.createMany({
        data: draftData.personalityQuestions.map((payload) => ({
          releaseId,
          sourceQuestionId: payload.id,
          payload: payload as unknown as Prisma.InputJsonValue
        }))
      });
    }

    const careerRows = Object.entries(draftData.careerSynergy).flatMap(([careerKey, byCategory]) =>
      Object.entries(byCategory).map(([category, score]) => ({
        releaseId,
        careerKey,
        category,
        score
      }))
    );
    if (careerRows.length > 0) {
      await tx.careerSynergyDraft.createMany({ data: careerRows });
    }

    if (draftData.competencyGuide.length > 0) {
      await tx.competencyGuideDraft.createMany({
        data: draftData.competencyGuide.map((payload) => ({
          releaseId,
          sourceGuideKey: payload.competency,
          payload: payload as unknown as Prisma.InputJsonValue
        }))
      });
    }
  });
}

async function getPrismaReleaseDetail(releaseId: string): Promise<DraftReleaseDetail | null> {
  if (!prisma) {
    throw new Error('Prisma client is not available.');
  }

  const release = await prisma.masterDataRelease.findUnique({ where: { id: releaseId } });
  if (!release) return null;

  return {
    release: toReleaseRecord(release),
    draftData: await loadDraftDataFromPrismaRelease(releaseId)
  };
}

function getAllowedCategories(baseline?: PublishedMasterData | null, draftData?: MasterDataDraftPayload) {
  const categories = baseline?.startupItems.map((item) => item.category)
    ?? draftData?.startupItems.map((item) => item.category)
    ?? [];
  return Array.from(new Set(categories.filter(Boolean))).sort();
}

async function getBaselineForValidation(candidateReleaseId?: string) {
  const published = await getPublishedReleaseDetail();
  if (!published) return null;
  if (candidateReleaseId && published.release.id === candidateReleaseId) {
    return published.release.snapshotJson;
  }
  return published.release.snapshotJson;
}

async function promoteLocalRelease(releaseId: string, action: 'publish' | 'rollback', adminUserId?: string | null) {
  const storage = await ensureLocalBaselineRelease();
  const index = storage.masterDataReleases.findIndex((release) => release.id === releaseId);
  if (index < 0) return null;

  const target = storage.masterDataReleases[index];
  const baseline = storage.masterDataReleases.find((release) => release.status === 'published' && release.id !== releaseId)?.snapshotJson ?? null;
  const validation = validateMasterDataDraft({
    releaseId: target.id,
    version: target.version,
    draftData: target.draftData,
    baseline,
    allowedCategories: getAllowedCategories(baseline, target.draftData)
  });

  if (validation.issues.some((issue) => issue.severity === 'error')) {
    const error = new Error('릴리스 검증에 실패했습니다.');
    (error as Error & { report?: MasterDataValidationReport }).report = validation;
    throw error;
  }

  storage.masterDataReleases = storage.masterDataReleases.map((release) => ({
    ...release,
    status: release.id === releaseId ? 'published' : release.status === 'published' ? 'archived' : release.status,
    publishedAt: release.id === releaseId ? new Date().toISOString() : release.publishedAt,
    snapshotJson:
      release.id === releaseId
        ? buildPublishedMasterData({
            releaseId: target.id,
            version: target.version,
            draftData: target.draftData
          })
        : release.snapshotJson
  }));

  await writeStorage(storage);
  invalidatePublishedMasterDataCache();
  const promoted = storage.masterDataReleases.find((release) => release.id === releaseId)!;
  await writeReleaseBackup(promoted.snapshotJson!);
  await appendAuditLog({
    adminUserId: adminUserId ?? null,
    action,
    targetType: 'master-data-release',
    targetId: releaseId,
    beforeJson: null,
    afterJson: summarizeRelease({ release: promoted, draftData: promoted.draftData })
  });

  return {
    release: promoted,
    validation
  };
}

export async function listMasterDataReleases(): Promise<MasterDataReleaseSummary[]> {
  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    try {
      const releases = await prisma.masterDataRelease.findMany({
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
      });
      const startupItems = await prisma.startupItemDraft.findMany({
        where: { releaseId: { in: releases.map((release) => release.id) } },
        select: { releaseId: true, rowStatus: true }
      });
      const stats = startupItems.reduce<Record<string, { itemCount: number; activeItemCount: number }>>((acc, item) => {
        if (!acc[item.releaseId]) {
          acc[item.releaseId] = { itemCount: 0, activeItemCount: 0 };
        }
        acc[item.releaseId].itemCount += 1;
        if (item.rowStatus === 'active') {
          acc[item.releaseId].activeItemCount += 1;
        }
        return acc;
      }, {});

      return releases.map((release) => ({
        ...toReleaseRecord(release),
        itemCount: stats[release.id]?.itemCount ?? 0,
        activeItemCount: stats[release.id]?.activeItemCount ?? 0
      }));
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const storage = await ensureLocalBaselineRelease();
  return storage.masterDataReleases
    .map((release) => summarizeRelease({ release, draftData: release.draftData }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getMasterDataReleaseDetail(releaseId: string): Promise<DraftReleaseDetail | null> {
  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    try {
      return await getPrismaReleaseDetail(releaseId);
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const storage = await ensureLocalBaselineRelease();
  const release = storage.masterDataReleases.find((entry) => entry.id === releaseId);
  if (!release) return null;
  return {
    release: cloneValue(release),
    draftData: cloneValue(release.draftData)
  };
}

export async function getMasterDataReleaseSummary(releaseId: string) {
  const detail = await getMasterDataReleaseDetail(releaseId);
  return detail ? summarizeRelease(detail) : null;
}

export async function findMasterDataReleaseByVersion(version: string) {
  const releases = await listMasterDataReleases();
  return releases.find((release) => release.version === version) ?? null;
}

export async function getPublishedReleaseDetail(): Promise<DraftReleaseDetail | null> {
  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    try {
      const release = await prisma.masterDataRelease.findFirst({
        where: { status: 'published' },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
      });
      if (!release) return null;
      return {
        release: toReleaseRecord(release),
        draftData: await loadDraftDataFromPrismaRelease(release.id)
      };
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const storage = await ensureLocalBaselineRelease();
  const release = storage.masterDataReleases.find((entry) => entry.status === 'published') ?? storage.masterDataReleases[0];
  if (!release) return null;
  return {
    release: cloneValue(release),
    draftData: cloneValue(release.draftData)
  };
}

export async function getReleaseCategories(releaseId: string) {
  const detail = await getMasterDataReleaseDetail(releaseId);
  if (!detail) return [];
  return getAllowedCategories(await getBaselineForValidation(releaseId), detail.draftData);
}

export async function createMasterDataRelease(params: {
  version: string;
  notes?: string | null;
  baseReleaseId?: string | null;
  createdById?: string | null;
}) {
  const version = params.version.trim();
  if (!version) {
    throw new Error('release version이 필요합니다.');
  }

  const baseRelease = params.baseReleaseId
    ? await getMasterDataReleaseDetail(params.baseReleaseId)
    : await getPublishedReleaseDetail();

  const baseDraftData = cloneValue(baseRelease?.draftData ?? toDraftMasterData({
    ...DEFAULT_MASTER_DATA,
    releaseId: createId('release'),
    version: BASELINE_VERSION
  }));

  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    try {
      const existing = await prisma.masterDataRelease.findUnique({ where: { version } });
      if (existing) {
        throw new Error(`이미 존재하는 release version입니다: ${version}`);
      }

      const created = await prisma.masterDataRelease.create({
        data: {
          version,
          status: 'draft',
          baseReleaseId: baseRelease?.release.id ?? null,
          notes: params.notes ?? null,
          createdById: params.createdById ?? null
        }
      });
      const detail = {
        release: toReleaseRecord(created),
        draftData: {
          ...baseDraftData,
          startupItems: baseDraftData.startupItems.map((item) => ({
            ...item,
            draftId: createId('draft_item'),
            releaseId: created.id
          }))
        }
      };
      await saveDraftDataToPrisma(created.id, detail.draftData);
      await appendAuditLog({
        adminUserId: params.createdById ?? null,
        action: 'release.create',
        targetType: 'master-data-release',
        targetId: created.id,
        beforeJson: null,
        afterJson: summarizeRelease(detail)
      });
      return summarizeRelease(detail);
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const storage = await ensureLocalBaselineRelease();
  if (storage.masterDataReleases.some((release) => release.version === version)) {
    throw new Error(`이미 존재하는 release version입니다: ${version}`);
  }

  const draftData = {
    ...baseDraftData,
    startupItems: baseDraftData.startupItems.map((item) => ({
      ...item,
      draftId: createId('draft_item')
    }))
  };
  const release = createStoredRelease({
    version,
    status: 'draft',
    draftData,
    baseReleaseId: params.baseReleaseId ?? baseRelease?.release.id ?? null,
    notes: params.notes ?? null,
    createdById: params.createdById ?? null
  });

  storage.masterDataReleases.unshift(release);
  await writeStorage(storage);
  await appendAuditLog({
    adminUserId: params.createdById ?? null,
    action: 'release.create',
    targetType: 'master-data-release',
    targetId: release.id,
    beforeJson: null,
    afterJson: summarizeRelease({ release, draftData: release.draftData })
  });
  return summarizeRelease({ release, draftData: release.draftData });
}

export async function cloneMasterDataRelease(releaseId: string, params: { version: string; notes?: string | null; createdById?: string | null }) {
  const source = await getMasterDataReleaseDetail(releaseId);
  if (!source) {
    throw new Error('복제할 release를 찾을 수 없습니다.');
  }

  return createMasterDataRelease({
    version: params.version,
    notes: params.notes ?? `clone:${source.release.version}`,
    baseReleaseId: source.release.id,
    createdById: params.createdById ?? null
  });
}

export async function validateMasterDataRelease(releaseId: string) {
  const detail = await getMasterDataReleaseDetail(releaseId);
  if (!detail) return null;
  const baseline = await getBaselineForValidation(releaseId);
  return validateMasterDataDraft({
    releaseId: detail.release.id,
    version: detail.release.version,
    draftData: detail.draftData,
    baseline,
    allowedCategories: getAllowedCategories(baseline, detail.draftData)
  });
}

export async function listCatalogItems(options: {
  releaseId: string;
  category?: string;
  rowStatus?: DraftStartupItem['rowStatus'] | 'all';
}) {
  const detail = await getMasterDataReleaseDetail(options.releaseId);
  if (!detail) return [];
  return detail.draftData.startupItems
    .filter((item) => (options.category ? item.category === options.category : true))
    .filter((item) => (options.rowStatus && options.rowStatus !== 'all' ? item.rowStatus === options.rowStatus : true))
    .sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name));
}

export async function getCatalogItem(draftId: string) {
  const releases = await listMasterDataReleases();
  for (const release of releases) {
    const detail = await getMasterDataReleaseDetail(release.id);
    const item = detail?.draftData.startupItems.find((entry) => entry.draftId === draftId);
    if (detail && item) {
      return {
        release: detail.release,
        item
      };
    }
  }
  return null;
}

function getNextStartupItemId(items: DraftStartupItem[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function assertEditableRelease(release: MasterDataReleaseRecord) {
  if (release.status !== 'draft') {
    throw new Error('draft release만 수정할 수 있습니다.');
  }
}

function createValidationError(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
}

async function assertCatalogItemCanBeSaved(
  detail: DraftReleaseDetail,
  candidate: CatalogMutationInput & { id: number },
  currentDraftId?: string
) {
  const baseline = await getBaselineForValidation(detail.release.id);
  const allowedCategories = getAllowedCategories(baseline, detail.draftData);
  if (!allowedCategories.includes(candidate.category)) {
    throw createValidationError(`허용되지 않은 카테고리입니다: ${candidate.category}`);
  }

  const duplicatedName = detail.draftData.startupItems.find(
    (item) =>
      item.draftId !== currentDraftId &&
      item.name.trim().toLowerCase() === candidate.name.trim().toLowerCase()
  );
  if (duplicatedName) {
    throw createValidationError(`중복 업종명입니다: ${candidate.name}`);
  }

  const duplicatedId = detail.draftData.startupItems.find(
    (item) => item.draftId !== currentDraftId && item.id === candidate.id
  );
  if (duplicatedId) {
    throw createValidationError(`중복 업종 ID입니다: ${candidate.id}`);
  }
}

export async function createCatalogItem(releaseId: string, input: CatalogMutationInput, adminUserId?: string | null) {
  const detail = await getMasterDataReleaseDetail(releaseId);
  if (!detail) {
    throw new Error('release를 찾을 수 없습니다.');
  }
  assertEditableRelease(detail.release);

  const nextId = input.id || getNextStartupItemId(detail.draftData.startupItems);
  const item: DraftStartupItem = {
    ...input,
    id: nextId,
    sourceItemId: nextId,
    draftId: createId('draft_item'),
    releaseId,
    rowStatus: input.rowStatus ?? 'active'
  };
  await assertCatalogItemCanBeSaved(detail, item);

  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    await prisma.startupItemDraft.create({
      data: {
        id: item.draftId,
        releaseId,
        sourceItemId: item.sourceItemId,
        rowStatus: item.rowStatus,
        category: item.category,
        name: item.name,
        coreSkills: item.coreSkills,
        investmentRange: item.investmentRange,
        investmentMin: item.investmentMin,
        investmentMax: item.investmentMax,
        competencyScores: item.competencyScores as unknown as Prisma.InputJsonValue,
        operationType: item.operationType,
        requiredStaff: item.requiredStaff,
        weekendWork: item.weekendWork,
        workLifeBalance: item.workLifeBalance,
        seasonality: item.seasonality,
        requiredLicense: item.requiredLicense,
        avgMonthlyRevenue: item.avgMonthlyRevenue,
        operatingMargin: item.operatingMargin,
        breakeven: item.breakeven,
        competitionLevel: item.competitionLevel,
        differentiationRoom: item.differentiationRoom,
        closureRate: item.closureRate,
        growthPotential: item.growthPotential,
        entryBarrier: item.entryBarrier
      }
    });
  } else {
    const storage = await ensureLocalBaselineRelease();
    const release = storage.masterDataReleases.find((entry) => entry.id === releaseId);
    if (!release) {
      throw new Error('release를 찾을 수 없습니다.');
    }
    release.draftData.startupItems.push(item);
    await writeStorage(storage);
  }

  await appendAuditLog({
    adminUserId: adminUserId ?? null,
    action: 'catalog.create',
    targetType: 'startup-item-draft',
    targetId: item.draftId,
    beforeJson: null,
    afterJson: item
  });
  return item;
}

export async function updateCatalogItem(draftId: string, input: Partial<CatalogMutationInput>, adminUserId?: string | null) {
  const current = await getCatalogItem(draftId);
  if (!current) {
    throw new Error('수정할 업종을 찾을 수 없습니다.');
  }
  assertEditableRelease(current.release);

  const updated: DraftStartupItem = {
    ...current.item,
    ...input,
    id: input.id ?? current.item.id,
    sourceItemId: input.id ?? current.item.id,
    draftId,
    releaseId: current.item.releaseId
  };
  const detail = await getMasterDataReleaseDetail(current.release.id);
  if (!detail) {
    throw new Error('release를 찾을 수 없습니다.');
  }
  await assertCatalogItemCanBeSaved(detail, updated, draftId);

  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    await prisma.startupItemDraft.update({
      where: { id: draftId },
      data: {
        sourceItemId: updated.id,
        rowStatus: updated.rowStatus,
        category: updated.category,
        name: updated.name,
        coreSkills: updated.coreSkills,
        investmentRange: updated.investmentRange,
        investmentMin: updated.investmentMin,
        investmentMax: updated.investmentMax,
        competencyScores: updated.competencyScores as unknown as Prisma.InputJsonValue,
        operationType: updated.operationType,
        requiredStaff: updated.requiredStaff,
        weekendWork: updated.weekendWork,
        workLifeBalance: updated.workLifeBalance,
        seasonality: updated.seasonality,
        requiredLicense: updated.requiredLicense,
        avgMonthlyRevenue: updated.avgMonthlyRevenue,
        operatingMargin: updated.operatingMargin,
        breakeven: updated.breakeven,
        competitionLevel: updated.competitionLevel,
        differentiationRoom: updated.differentiationRoom,
        closureRate: updated.closureRate,
        growthPotential: updated.growthPotential,
        entryBarrier: updated.entryBarrier
      }
    });
  } else {
    const storage = await ensureLocalBaselineRelease();
    const release = storage.masterDataReleases.find((entry) => entry.id === current.release.id);
    const index = release?.draftData.startupItems.findIndex((entry) => entry.draftId === draftId) ?? -1;
    if (!release || index < 0) {
      throw new Error('수정할 업종을 찾을 수 없습니다.');
    }
    release.draftData.startupItems[index] = updated;
    await writeStorage(storage);
  }

  await appendAuditLog({
    adminUserId: adminUserId ?? null,
    action: 'catalog.update',
    targetType: 'startup-item-draft',
    targetId: draftId,
    beforeJson: current.item,
    afterJson: updated
  });
  return updated;
}

export async function publishMasterDataRelease(releaseId: string, adminUserId?: string | null) {
  if (canUsePrisma() && prisma) {
    try {
      const detail = await getPrismaReleaseDetail(releaseId);
      if (!detail) return null;
      const baseline = await getBaselineForValidation(releaseId);
      const validation = validateMasterDataDraft({
        releaseId: detail.release.id,
        version: detail.release.version,
        draftData: detail.draftData,
        baseline,
        allowedCategories: getAllowedCategories(baseline, detail.draftData)
      });

      if (validation.issues.some((issue) => issue.severity === 'error')) {
        const error = new Error('릴리스 검증에 실패했습니다.');
        (error as Error & { report?: MasterDataValidationReport }).report = validation;
        throw error;
      }

      const snapshot = buildPublishedMasterData({
        releaseId: detail.release.id,
        version: detail.release.version,
        draftData: detail.draftData
      });

      await prisma.$transaction(async (tx) => {
        await tx.masterDataRelease.updateMany({
          where: { status: 'published', NOT: { id: releaseId } },
          data: { status: 'archived' }
        });
        await tx.masterDataRelease.update({
          where: { id: releaseId },
          data: {
            status: 'published',
            publishedAt: new Date(),
            snapshotJson: snapshot as unknown as Prisma.InputJsonValue
          }
        });
      });

      invalidatePublishedMasterDataCache();
      await writeReleaseBackup(snapshot);
      await appendAuditLog({
        adminUserId: adminUserId ?? null,
        action: 'publish',
        targetType: 'master-data-release',
        targetId: releaseId,
        beforeJson: null,
        afterJson: { version: detail.release.version, distinctTop1Count: validation.distinctTop1Count }
      });

      return {
        release: await getMasterDataReleaseSummary(releaseId),
        validation
      };
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const promoted = await promoteLocalRelease(releaseId, 'publish', adminUserId);
  return promoted
    ? { release: summarizeRelease({ release: promoted.release, draftData: promoted.release.draftData }), validation: promoted.validation }
    : null;
}

export async function rollbackMasterDataRelease(releaseId: string, adminUserId?: string | null) {
  if (canUsePrisma() && prisma) {
    try {
      const detail = await getPrismaReleaseDetail(releaseId);
      if (!detail) return null;

      const snapshot = detail.release.snapshotJson ?? buildPublishedMasterData({
        releaseId: detail.release.id,
        version: detail.release.version,
        draftData: detail.draftData
      });

      await prisma.$transaction(async (tx) => {
        await tx.masterDataRelease.updateMany({
          where: { status: 'published', NOT: { id: releaseId } },
          data: { status: 'archived' }
        });
        await tx.masterDataRelease.update({
          where: { id: releaseId },
          data: {
            status: 'published',
            publishedAt: new Date(),
            snapshotJson: snapshot as unknown as Prisma.InputJsonValue
          }
        });
      });

      invalidatePublishedMasterDataCache();
      await writeReleaseBackup(snapshot);
      await appendAuditLog({
        adminUserId: adminUserId ?? null,
        action: 'rollback',
        targetType: 'master-data-release',
        targetId: releaseId,
        beforeJson: null,
        afterJson: { version: detail.release.version }
      });

      return getMasterDataReleaseSummary(releaseId);
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const promoted = await promoteLocalRelease(releaseId, 'rollback', adminUserId);
  return promoted ? summarizeRelease({ release: promoted.release, draftData: promoted.release.draftData }) : null;
}

export async function listAdminAuditLogs(limit = 50): Promise<AdminAuditLogEntry[]> {
  if (canUsePrisma() && prisma) {
    try {
      const logs = await prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      return logs.map((log) => ({
        id: log.id,
        adminUserId: log.adminUserId,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        beforeJson: log.beforeJson,
        afterJson: log.afterJson,
        createdAt: log.createdAt.toISOString()
      }));
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const storage = await readStorage();
  return storage.adminAuditLogs.slice(0, limit);
}
