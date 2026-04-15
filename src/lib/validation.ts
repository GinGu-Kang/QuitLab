import { z } from 'zod';

export const diagnoseInputSchema = z.object({
  hardFilter: z.object({
    capital: z.number().min(0),
    region: z.enum(['metro', 'city', 'town', 'rural']),
    license: z.string(),
    timing: z.enum(['now', '3m', '6m', '1y']),
    family: z.enum(['single', 'dual', 'sole']),
    income: z.number().min(0),
    career: z.enum([
      'it',
      'marketing',
      'sales',
      'finance',
      'manufacturing',
      'design',
      'food',
      'education',
      'medical',
      'logistics',
      'realestate',
      'public',
      'service',
      'office'
    ]),
    loan: z.boolean()
  }),
  competencyScores: z.array(z.number().min(1).max(5)).length(12),
  personalityAnswers: z.array(z.enum(['a', 'b'])).length(10),
  nickname: z.string().max(10).optional()
});

export const contactInputSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().min(1, '이름을 입력해주세요').max(20),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  phone: z
    .string()
    .regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호를 입력해주세요'),
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: '개인정보 수집 동의가 필요합니다' })
  }),
  marketingConsent: z.boolean()
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const releaseCreateSchema = z.object({
  version: z.string().min(1, 'release version이 필요합니다.').max(80),
  notes: z.string().max(500).optional(),
  baseReleaseId: z.string().min(1).optional()
});

export const releaseCloneSchema = z.object({
  version: z.string().min(1, '복제 release version이 필요합니다.').max(80),
  notes: z.string().max(500).optional()
});

const competencyScoreMapSchema = z.object({
  analytical: z.number().min(1).max(5),
  creativity: z.number().min(1).max(5),
  interpersonal: z.number().min(1).max(5),
  tech: z.number().min(1).max(5),
  sales: z.number().min(1).max(5),
  selfManagement: z.number().min(1).max(5),
  risk: z.number().min(1).max(5),
  trend: z.number().min(1).max(5),
  stamina: z.number().min(1).max(5),
  finance: z.number().min(1).max(5),
  leadership: z.number().min(1).max(5),
  content: z.number().min(1).max(5)
});

const catalogItemSchemaBase = z.object({
  id: z.number().int().positive().optional(),
  sourceItemId: z.number().int().positive().optional(),
  rowStatus: z.enum(['active', 'inactive']).default('active'),
  category: z.string().min(1, '카테고리를 입력해주세요.'),
  name: z.string().min(1, '업종명을 입력해주세요.'),
  coreSkills: z.string().min(1, '핵심 역량을 입력해주세요.'),
  investmentRange: z.string().min(1, '투자비 범위를 입력해주세요.'),
  investmentMin: z.number().int().min(0),
  investmentMax: z.number().int().min(0).nullable(),
  competencyScores: competencyScoreMapSchema,
  operationType: z.string().min(1),
  requiredStaff: z.string().min(1),
  weekendWork: z.string().min(1),
  workLifeBalance: z.number().min(1).max(5),
  seasonality: z.string().min(1),
  requiredLicense: z.string().min(1),
  avgMonthlyRevenue: z.string().min(1),
  operatingMargin: z.string().min(1),
  breakeven: z.string().min(1),
  competitionLevel: z.number().min(1).max(5),
  differentiationRoom: z.number().min(1).max(5),
  closureRate: z.string().min(1),
  growthPotential: z.number().min(1).max(5),
  entryBarrier: z.number().min(1).max(5)
});

export const catalogItemSchema = catalogItemSchemaBase
  .superRefine((value, ctx) => {
    if (value.investmentMax != null && value.investmentMax < value.investmentMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'investmentMax는 investmentMin보다 작을 수 없습니다.',
        path: ['investmentMax']
      });
    }
  });

export const catalogItemUpdateSchema = catalogItemSchemaBase.partial().superRefine((value, ctx) => {
  if (
    value.investmentMin != null &&
    value.investmentMax != null &&
    value.investmentMax < value.investmentMin
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'investmentMax는 investmentMin보다 작을 수 없습니다.',
      path: ['investmentMax']
    });
  }
});
