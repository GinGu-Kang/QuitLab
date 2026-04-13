import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const hasDatabase = Boolean(process.env.DATABASE_URL);

export const prisma =
  hasDatabase && (global.prismaGlobal || new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] }));

if (process.env.NODE_ENV !== 'production' && prisma) {
  global.prismaGlobal = prisma;
}

export function canUsePrisma() {
  return Boolean(prisma && process.env.DATABASE_URL);
}
