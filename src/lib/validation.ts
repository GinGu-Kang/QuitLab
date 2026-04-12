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
