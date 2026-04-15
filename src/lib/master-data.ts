import { canUsePrisma, prisma } from '@/lib/prisma';
import { DEFAULT_MASTER_DATA } from '@/lib/master-data-defaults';
import { readStorage } from '@/lib/repository';
import type { PublishedMasterData } from '@/types';

let cachedPublishedMasterData: PublishedMasterData | null = null;
let cachedPublishedMasterDataPromise: Promise<PublishedMasterData> | null = null;
let masterDataSchemaPromise: Promise<boolean> | null = null;

function cloneMasterData(data: PublishedMasterData): PublishedMasterData {
  return JSON.parse(JSON.stringify(data)) as PublishedMasterData;
}

function isPublishedMasterData(value: unknown): value is PublishedMasterData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PublishedMasterData>;
  return (
    typeof candidate.releaseId === 'string' &&
    typeof candidate.version === 'string' &&
    Array.isArray(candidate.startupItems) &&
    Array.isArray(candidate.competencyQuestions) &&
    Array.isArray(candidate.hardFilters) &&
    Array.isArray(candidate.personalityQuestions) &&
    Boolean(candidate.careerSynergy) &&
    Array.isArray(candidate.competencyGuide)
  );
}

function shouldFallbackToStorage(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['P2021', 'P2022'].includes(String((error as { code?: string }).code))
  );
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

async function loadPublishedMasterData(): Promise<PublishedMasterData> {
  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    try {
      const published = await prisma.masterDataRelease.findFirst({
        where: { status: 'published' },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
      });

      if (published && isPublishedMasterData(published.snapshotJson)) {
        return cloneMasterData(published.snapshotJson);
      }
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const storage = await readStorage();
  const localPublished = storage.masterDataReleases.find((release) => release.status === 'published');
  if (localPublished && isPublishedMasterData(localPublished.snapshotJson)) {
    return cloneMasterData(localPublished.snapshotJson);
  }

  return cloneMasterData(DEFAULT_MASTER_DATA);
}

export async function getMasterDataByReleaseId(releaseId?: string | null) {
  if (!releaseId) {
    return getPublishedMasterData();
  }

  if (canUsePrisma() && prisma && await hasMasterDataSchema()) {
    try {
      const release = await prisma.masterDataRelease.findUnique({ where: { id: releaseId } });
      if (release && isPublishedMasterData(release.snapshotJson)) {
        return cloneMasterData(release.snapshotJson);
      }
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const storage = await readStorage();
  const localRelease = storage.masterDataReleases.find((release) => release.id === releaseId);
  if (localRelease && isPublishedMasterData(localRelease.snapshotJson)) {
    return cloneMasterData(localRelease.snapshotJson);
  }

  return cloneMasterData(DEFAULT_MASTER_DATA);
}

export async function getPublishedMasterData() {
  if (cachedPublishedMasterData) {
    return cloneMasterData(cachedPublishedMasterData);
  }

  if (!cachedPublishedMasterDataPromise) {
    cachedPublishedMasterDataPromise = loadPublishedMasterData().then((data) => {
      cachedPublishedMasterData = data;
      cachedPublishedMasterDataPromise = null;
      return data;
    });
  }

  const data = await cachedPublishedMasterDataPromise;
  return cloneMasterData(data);
}

export function invalidatePublishedMasterDataCache() {
  cachedPublishedMasterData = null;
  cachedPublishedMasterDataPromise = null;
}
