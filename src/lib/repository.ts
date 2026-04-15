import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

import type {
  AdminStats,
  AnalyticsEventName,
  AppStorageShape,
  ContactInput,
  DiagnoseInput,
  MatchResult,
  PersistedAnalyticsEvent,
  PersistedContact,
  PersistedResult
} from '@/types';
import { canUsePrisma, prisma } from '@/lib/prisma';
import { createId, groupByDate } from '@/lib/utils';

const storagePath = path.join(process.cwd(), '.local-data', 'storage.json');
const DEV_ADMIN = {
  email: 'admin@local.dev',
  passwordHash: bcrypt.hashSync('admin1234!', 10),
  createdAt: new Date(0).toISOString()
};
let phase8UserResultSchemaPromise: Promise<boolean> | null = null;

function shouldFallbackToStorage(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ['P2021', 'P2022'].includes(error.code);
}

async function hasPhase8UserResultSchema() {
  if (!canUsePrisma() || !prisma) return false;
  if (!phase8UserResultSchemaPromise) {
    phase8UserResultSchemaPromise = prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND lower(table_name) = lower('UserResult')
          AND lower(column_name) = lower('masterDataReleaseId')
      ) AS "exists"
    `
      .then((rows) => Boolean(rows[0]?.exists))
      .catch(() => false);
  }
  return phase8UserResultSchemaPromise;
}

async function ensureStorageDir() {
  await fs.mkdir(path.dirname(storagePath), { recursive: true });
}

function createInitialStorage(): AppStorageShape {
  return {
    results: [],
    contacts: [],
    events: [],
    admins: process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH
      ? [
          {
            email: process.env.ADMIN_EMAIL,
            passwordHash: process.env.ADMIN_PASSWORD_HASH,
            createdAt: new Date().toISOString()
          }
        ]
      : [],
    masterDataReleases: [],
    adminAuditLogs: []
  };
}

export async function readStorage(): Promise<AppStorageShape> {
  await ensureStorageDir();
  try {
    const raw = await fs.readFile(storagePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppStorageShape>;
    return {
      ...createInitialStorage(),
      ...parsed,
      results: parsed.results ?? [],
      contacts: parsed.contacts ?? [],
      events: parsed.events ?? [],
      admins: parsed.admins ?? [],
      masterDataReleases: parsed.masterDataReleases ?? [],
      adminAuditLogs: parsed.adminAuditLogs ?? []
    };
  } catch {
    const initial = createInitialStorage();
    await writeStorage(initial);
    return initial;
  }
}

export async function writeStorage(data: AppStorageShape) {
  await ensureStorageDir();
  await fs.writeFile(storagePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function saveResult(
  input: DiagnoseInput,
  sessionId: string,
  results: MatchResult[],
  meta: {
    userAgent?: string | null;
    ipHash?: string | null;
    masterDataReleaseId?: string | null;
    masterDataVersion?: string | null;
    matchingEngineVersion?: string | null;
  }
) {
  const record: PersistedResult = {
    id: createId('result'),
    sessionId,
    nickname: input.nickname || null || undefined,
    createdAt: new Date().toISOString(),
    hardFilterInputs: input.hardFilter,
    competencyScores: input.competencyScores,
    personalityAnswers: input.personalityAnswers,
    top5Results: results,
    comicImageUrl: null,
    userAgent: meta.userAgent ?? null,
    ipHash: meta.ipHash ?? null,
    masterDataReleaseId: meta.masterDataReleaseId ?? null,
    masterDataVersion: meta.masterDataVersion ?? null,
    matchingEngineVersion: meta.matchingEngineVersion ?? null
  };

  if (canUsePrisma() && prisma && await hasPhase8UserResultSchema()) {
    try {
      await prisma.userResult.create({
        data: {
          sessionId: record.sessionId,
          nickname: record.nickname,
          hardFilterInputs: record.hardFilterInputs as unknown as Prisma.InputJsonValue,
          competencyScores: record.competencyScores as unknown as Prisma.InputJsonValue,
          personalityAnswers: record.personalityAnswers as unknown as Prisma.InputJsonValue,
          top5Results: record.top5Results as unknown as Prisma.InputJsonValue,
          comicImageUrl: record.comicImageUrl,
          userAgent: record.userAgent,
          ipHash: record.ipHash,
          masterDataReleaseId: record.masterDataReleaseId,
          masterDataVersion: record.masterDataVersion,
          matchingEngineVersion: record.matchingEngineVersion
        }
      });
      return record;
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const data = await readStorage();
  data.results.push(record);
  await writeStorage(data);
  return record;
}

export async function getResultBySession(sessionId: string) {
  if (canUsePrisma() && prisma && await hasPhase8UserResultSchema()) {
    try {
      const result = await prisma.userResult.findUnique({ where: { sessionId } });
      if (!result) return null;
      return {
        id: result.id,
        sessionId: result.sessionId,
        nickname: result.nickname ?? undefined,
        createdAt: result.createdAt.toISOString(),
        hardFilterInputs: result.hardFilterInputs as unknown as PersistedResult['hardFilterInputs'],
        competencyScores: result.competencyScores as unknown as number[],
        personalityAnswers: result.personalityAnswers as unknown as PersistedResult['personalityAnswers'],
        top5Results: result.top5Results as unknown as MatchResult[],
        comicImageUrl: result.comicImageUrl,
        userAgent: result.userAgent,
        ipHash: result.ipHash,
        masterDataReleaseId: result.masterDataReleaseId,
        masterDataVersion: result.masterDataVersion,
        matchingEngineVersion: result.matchingEngineVersion
      } satisfies PersistedResult;
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const data = await readStorage();
  return data.results.find((entry) => entry.sessionId === sessionId) ?? null;
}

export async function saveContact(input: ContactInput, payload: Omit<PersistedContact, 'id' | 'createdAt' | 'updatedAt'>) {
  if (canUsePrisma() && prisma && await hasPhase8UserResultSchema()) {
    try {
      const result = await prisma.userResult.findUnique({ where: { sessionId: input.sessionId } });
      if (!result) return null;
      const contact = await prisma.userContact.upsert({
        where: { userResultId: result.id },
        update: {
          name: payload.name,
          email: payload.email,
          phoneEncrypted: payload.phoneEncrypted,
          phoneHash: payload.phoneHash,
          privacyConsent: payload.privacyConsent,
          privacyConsentAt: new Date(payload.privacyConsentAt),
          marketingConsent: payload.marketingConsent,
          marketingConsentAt: payload.marketingConsentAt ? new Date(payload.marketingConsentAt) : null,
          consentIpHash: payload.consentIpHash,
          consentUserAgent: payload.consentUserAgent,
          unsubscribedAt: payload.unsubscribedAt ? new Date(payload.unsubscribedAt) : null
        },
        create: {
          userResultId: result.id,
          name: payload.name,
          email: payload.email,
          phoneEncrypted: payload.phoneEncrypted,
          phoneHash: payload.phoneHash,
          privacyConsent: payload.privacyConsent,
          privacyConsentAt: new Date(payload.privacyConsentAt),
          marketingConsent: payload.marketingConsent,
          marketingConsentAt: payload.marketingConsentAt ? new Date(payload.marketingConsentAt) : null,
          consentIpHash: payload.consentIpHash,
          consentUserAgent: payload.consentUserAgent,
          unsubscribeToken: payload.unsubscribeToken
        }
      });
      return {
        ...payload,
        id: contact.id,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      } satisfies PersistedContact;
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const data = await readStorage();
  const result = data.results.find((entry) => entry.sessionId === input.sessionId);
  if (!result) return null;
  const existingIndex = data.contacts.findIndex((entry) => entry.sessionId === input.sessionId);
  const contact: PersistedContact = {
    ...payload,
    id: existingIndex >= 0 ? data.contacts[existingIndex].id : createId('contact'),
    createdAt: existingIndex >= 0 ? data.contacts[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (existingIndex >= 0) {
    data.contacts[existingIndex] = contact;
  } else {
    data.contacts.push(contact);
  }
  await writeStorage(data);
  return contact;
}

export async function getContactByToken(token: string) {
  if (canUsePrisma() && prisma && await hasPhase8UserResultSchema()) {
    try {
      const contact = await prisma.userContact.findUnique({ where: { unsubscribeToken: token } });
      if (!contact) return null;
      const result = await prisma.userResult.findUnique({ where: { id: contact.userResultId } });
      return {
        id: contact.id,
        userResultId: contact.userResultId,
        sessionId: result?.sessionId ?? '',
        name: contact.name,
        email: contact.email,
        phoneEncrypted: contact.phoneEncrypted,
        phoneHash: contact.phoneHash,
        privacyConsent: contact.privacyConsent,
        privacyConsentAt: contact.privacyConsentAt?.toISOString() ?? new Date().toISOString(),
        marketingConsent: contact.marketingConsent,
        marketingConsentAt: contact.marketingConsentAt?.toISOString() ?? null,
        consentIpHash: contact.consentIpHash,
        consentUserAgent: contact.consentUserAgent,
        unsubscribedAt: contact.unsubscribedAt?.toISOString() ?? null,
        unsubscribeToken: contact.unsubscribeToken,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      } satisfies PersistedContact;
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const data = await readStorage();
  return data.contacts.find((entry) => entry.unsubscribeToken === token) ?? null;
}

export async function unsubscribeContact(token: string) {
  if (canUsePrisma() && prisma && await hasPhase8UserResultSchema()) {
    try {
      const contact = await prisma.userContact.findUnique({ where: { unsubscribeToken: token } });
      if (!contact) return null;
      await prisma.userContact.update({
        where: { unsubscribeToken: token },
        data: { unsubscribedAt: new Date() }
      });
      return true;
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const data = await readStorage();
  const target = data.contacts.find((entry) => entry.unsubscribeToken === token);
  if (!target) return null;
  target.unsubscribedAt = new Date().toISOString();
  target.updatedAt = new Date().toISOString();
  await writeStorage(data);
  return true;
}

export async function recordAnalyticsEvent(
  sessionId: string,
  eventType: AnalyticsEventName,
  metadata?: PersistedAnalyticsEvent['metadata']
) {
  if (canUsePrisma() && prisma && await hasPhase8UserResultSchema()) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          sessionId,
          eventType,
          metadata: metadata ?? undefined
        }
      });
      return;
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const data = await readStorage();
  data.events.push({
    id: createId('event'),
    sessionId,
    eventType,
    metadata,
    createdAt: new Date().toISOString()
  });
  await writeStorage(data);
}

export async function getAdminUser(email: string) {
  if (canUsePrisma() && prisma) {
    try {
      return await prisma.adminUser.findUnique({ where: { email } });
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }
  const data = await readStorage();
  const found = data.admins.find((entry) => entry.email === email);
  if (found) return found;
  if (process.env.NODE_ENV !== 'production' && email === DEV_ADMIN.email) {
    return DEV_ADMIN;
  }
  return null;
}

export async function getAdminStats(): Promise<AdminStats> {
  if (canUsePrisma() && prisma && await hasPhase8UserResultSchema()) {
    try {
      const [results, contacts, events] = await Promise.all([
        prisma.userResult.findMany({ orderBy: { createdAt: 'asc' } }),
        prisma.userContact.findMany(),
        prisma.analyticsEvent.findMany()
      ]);

      const dailyMap = groupByDate(results.map((entry) => ({ createdAt: entry.createdAt.toISOString() })));
      const topItems = results.reduce<Record<string, number>>((acc, entry) => {
        const first = (entry.top5Results as unknown as MatchResult[])[0]?.item.name;
        if (first) acc[first] = (acc[first] || 0) + 1;
        return acc;
      }, {});
      const funnel = events.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.eventType] = (acc[entry.eventType] || 0) + 1;
        return acc;
      }, {});

      return {
        totalParticipants: results.length,
        dailyTrend: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
        topItems: Object.entries(topItems)
          .map(([name, count]) => ({ name, count }))
          .sort((left, right) => right.count - left.count)
          .slice(0, 10),
        funnel: Object.entries(funnel).map(([eventType, count]) => ({ eventType, count })),
        emailCollectionRate: results.length ? Math.round((contacts.length / results.length) * 100) : 0
      };
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const data = await readStorage();
  const dailyMap = groupByDate(data.results);
  const topItems = data.results.reduce<Record<string, number>>((acc, entry) => {
    const first = entry.top5Results[0]?.item.name;
    if (first) acc[first] = (acc[first] || 0) + 1;
    return acc;
  }, {});
  const funnel = data.events.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.eventType] = (acc[entry.eventType] || 0) + 1;
    return acc;
  }, {});

  return {
    totalParticipants: data.results.length,
    dailyTrend: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
    topItems: Object.entries(topItems)
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 10),
    funnel: Object.entries(funnel).map(([eventType, count]) => ({ eventType, count })),
    emailCollectionRate: data.results.length ? Math.round((data.contacts.length / data.results.length) * 100) : 0
  };
}

export async function listCustomers(options?: { query?: string; marketingOnly?: boolean }) {
  if (canUsePrisma() && prisma) {
    try {
      const contacts = await prisma.userContact.findMany({
        where: {
          ...(options?.marketingOnly ? { marketingConsent: true, unsubscribedAt: null } : {}),
          ...(options?.query
            ? {
                OR: [
                  { name: { contains: options.query, mode: 'insensitive' } },
                  { email: { contains: options.query, mode: 'insensitive' } }
                ]
              }
            : {})
        },
        orderBy: { createdAt: 'desc' }
      });
      return contacts.map((contact) => ({
        ...contact,
        privacyConsentAt: contact.privacyConsentAt?.toISOString() ?? null,
        marketingConsentAt: contact.marketingConsentAt?.toISOString() ?? null,
        unsubscribedAt: contact.unsubscribedAt?.toISOString() ?? null,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString()
      }));
    } catch (error) {
      if (!shouldFallbackToStorage(error)) {
        throw error;
      }
    }
  }

  const data = await readStorage();
  const query = options?.query?.toLowerCase().trim();
  return data.contacts.filter((contact) => {
    if (options?.marketingOnly && (!contact.marketingConsent || contact.unsubscribedAt)) {
      return false;
    }
    if (!query) return true;
    return contact.name.toLowerCase().includes(query) || contact.email.toLowerCase().includes(query);
  });
}

export async function buildMarketingCsv() {
  const customers = await listCustomers({ marketingOnly: true });
  const rows = ['name,email,createdAt'];
  customers.forEach((customer) => {
    const name = 'name' in customer ? customer.name : '';
    const email = 'email' in customer ? customer.email : '';
    const createdAt = 'createdAt' in customer ? customer.createdAt : '';
    rows.push(`"${name.replace(/"/g, '""')}","${email.replace(/"/g, '""')}","${createdAt}"`);
  });
  return rows.join('\n');
}
