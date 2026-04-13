# Phase 2: 매칭 알고리즘 + API 라우트

> **사전 조건**: Phase 1 완료 (JSON 데이터, 타입 시스템)
> **산출물**: 매칭 알고리즘, 검증 API, 단위 테스트
> **예상 파일 수**: ~10-15개

---

## 2-1. 매칭 알고리즘 구현

### 파일: `src/lib/matching.ts`

엑셀 ⑤ 시트의 4단계를 그대로 구현. 임의 수정 금지.

```typescript
import items from '@/data/startup-items.json';
import careerSynergyData from '@/data/career-synergy.json';
import personalityQuestions from '@/data/personality-questions.json';
import type { DiagnoseInput, MatchResult, StartupItem, CareerSynergyMatrix } from '@/types';
import { COMPETENCY_KEYS } from '@/types';

const startupItems = items as StartupItem[];
const careerSynergy = careerSynergyData as CareerSynergyMatrix;

export function matchStartups(input: DiagnoseInput): MatchResult[] {
  // STEP 1 → STEP 2 → STEP 3 → STEP 4
}
```

### STEP 1: 하드 필터

```typescript
function applyHardFilters(items: StartupItem[], input: DiagnoseInput) {
  const effectiveCapital = input.hardFilter.loan
    ? input.hardFilter.capital + 10000  // 대출 시 1억 추가
    : input.hardFilter.capital;

  return items.map(item => {
    const warningTags: string[] = [];
    const excluded = item.investmentMin > effectiveCapital;  // 1-1 자본금 필터

    // 1-2 자격증 필터: 제외 안 함, 경고만
    if (item.requiredLicense && item.requiredLicense !== '없음' && item.requiredLicense !== '-') {
      warningTags.push(`자격증 필요: ${item.requiredLicense}`);
    }

    // 1-3 지역 필터: 부적합 → 후순위 (penalty)
    let regionPenalty = 0;
    // (지역별 부적합 아이템 판단 로직 — 엑셀 ③ 시트 참조)

    // 1-4 퇴사시기 필터: 즉시 퇴사 + 준비기간 긴 아이템 → 후순위
    let timingPenalty = 0;
    if (input.hardFilter.timing === 'now' && item.entryBarrier >= 4) {
      timingPenalty = 10;
      warningTags.push('준비기간이 긴 업종');
    }

    return { item, excluded, warningTags, regionPenalty, timingPenalty };
  }).filter(x => !x.excluded);
}
```

### STEP 2-1: 역량 적합도 (최대 100점, 가중치 50%)

```typescript
function calcCompetencyFit(userScores: number[], item: StartupItem): number {
  // 엑셀 ⑤ 시트 수식 그대로:
  // 각 역량 i: gap = |user[i] - item[i]|
  //           기여 = (5 - gap) × item[i]  (요구가 높을수록 가중)
  // total = Σ기여 / max_possible × 100

  const scores = COMPETENCY_KEYS.map(k => item.competencyScores[k]);
  let total = 0;
  let maxPossible = 0;

  for (let i = 0; i < 12; i++) {
    const gap = Math.abs(userScores[i] - scores[i]);
    const weight = scores[i];  // 아이템 요구점수가 가중치
    total += (5 - gap) * weight;
    maxPossible += 5 * weight;  // gap=0일 때 최대
  }

  return maxPossible > 0 ? (total / maxPossible) * 100 : 0;
}
```

### STEP 2-2: 성향 일치도 (최대 100점, 가중치 30%)

```typescript
function calcPersonalityFit(answers: ('a' | 'b')[], item: StartupItem): number {
  // 10문항 각 답변이 선호하는 카테고리 태그 집계
  // 아이템의 카테고리가 이 태그에 얼마나 일치하는지 비율 × 100

  const favoredCategories: Record<string, number> = {};
  const questions = personalityQuestions as PersonalityQuestion[];

  answers.forEach((answer, i) => {
    if (!questions[i]) return;
    const cats = answer === 'a'
      ? questions[i].choiceA.favorableCategories
      : questions[i].choiceB.favorableCategories;
    cats.forEach(cat => {
      favoredCategories[cat] = (favoredCategories[cat] || 0) + 1;
    });
  });

  // 아이템의 카테고리, 운영형태 등과 매칭
  let matchCount = 0;
  let totalTags = Object.values(favoredCategories).reduce((a, b) => a + b, 0);

  if (favoredCategories[item.category]) {
    matchCount += favoredCategories[item.category];
  }
  // 운영형태, 주말근무, 워라밸 등도 태그 매칭 가능

  return totalTags > 0 ? (matchCount / totalTags) * 100 : 50;
}
```

### STEP 2-3: 경력 시너지 (0~20 보너스, 가중치 10%)

```typescript
function calcCareerSynergy(career: string, category: string): number {
  // 엑셀 ⑥ 매트릭스에서 값 조회 (0~4 스케일)
  const score = careerSynergy[career]?.[category] ?? 0;
  return score * 5;  // 0~20 보너스
}
```

### STEP 2-4: 시장 매력도 (0~100, 가중치 10%)

```typescript
function calcMarketAttractiveness(item: StartupItem): number {
  // 엑셀 ⑤: (성장잠재력 - 경쟁강도 + 차별화여지) normalized
  const raw = item.growthPotential - item.competitionLevel + item.differentiationRoom;
  // raw 범위: (1-5+1)=-3 ~ (5-1+5)=9, 정규화 0~100
  return ((raw + 3) / 12) * 100;
}
```

### STEP 3: 최종 점수

```typescript
const finalScore =
  competencyFit * 0.50 +
  personalityFit * 0.30 +
  careerSynergy * 0.10 +       // 0-20을 0-100으로 정규화
  marketAttractiveness * 0.10;
```

### STEP 4: 결과 반환

```typescript
function generateRiskWarnings(item: StartupItem): string[] {
  const warnings: string[] = [];
  // 폐업률 높음 (문자열에서 숫자 추출, 25% 이상이면 경고)
  // 경쟁강도 4 이상
  // 계절성 있음
  if (item.competitionLevel >= 4) warnings.push(`경쟁강도 높음 (${item.competitionLevel}/5)`);
  if (item.growthPotential <= 2) warnings.push('성장 잠재력 낮음');
  return warnings;
}

function calcCompetencyGap(userScores: number[], item: StartupItem) {
  return COMPETENCY_KEYS
    .map((key, i) => ({
      competency: key,
      label: COMPETENCY_LABELS[i],
      userScore: userScores[i],
      requiredScore: item.competencyScores[key],
    }))
    .filter(g => g.requiredScore >= 3 && g.userScore < g.requiredScore);  // 요구 3이상 & 부족한 역량만
}

// TOP 5 반환 (finalScore 내림차순)
return scored.sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
```

---

## 2-2. Zod 검증 스키마

### 파일: `src/lib/validation.ts`

```typescript
import { z } from 'zod';

export const diagnoseInputSchema = z.object({
  hardFilter: z.object({
    capital: z.number().min(0),
    region: z.enum(['metro', 'city', 'town', 'rural']),
    license: z.string(),
    timing: z.enum(['now', '3m', '6m', '1y']),
    family: z.enum(['single', 'dual', 'sole']),
    income: z.number().min(0),
    career: z.string(),
    loan: z.boolean(),
  }),
  competencyScores: z.array(z.number().min(1).max(5)).length(12),
  personalityAnswers: z.array(z.enum(['a', 'b'])).length(10),
});
```

---

## 2-3. API 라우트

### 파일: `src/app/api/diagnose/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { matchStartups } from '@/lib/matching';
import { diagnoseInputSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = diagnoseInputSchema.parse(body);

    const results = matchStartups(parsed);
    const sessionId = crypto.randomUUID();

    // Phase 3에서 DB 저장 추가 예정
    // await prisma.userResult.create({ ... })

    return NextResponse.json({ sessionId, results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 2-4. 단위 테스트

### 파일: `src/lib/__tests__/matching.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { matchStartups } from '../matching';
import type { DiagnoseInput } from '@/types';

// 기본 테스트 입력
const baseInput: DiagnoseInput = {
  hardFilter: {
    capital: 5000,  // 5천만원
    region: 'metro',
    license: 'none',
    timing: '3m',
    family: 'single',
    income: 300,
    career: 'it',
    loan: false,
  },
  competencyScores: [4, 3, 3, 5, 2, 4, 3, 4, 3, 3, 2, 4],  // IT 성향
  personalityAnswers: ['b', 'a', 'b', 'b', 'a', 'a', 'b', 'a', 'b', 'a'],
};

describe('matchStartups', () => {
  it('동일 입력 → 동일 결과 (결정론적)', () => {
    const r1 = matchStartups(baseInput);
    const r2 = matchStartups(baseInput);
    expect(r1.map(r => r.item.name)).toEqual(r2.map(r => r.item.name));
    expect(r1.map(r => r.finalScore)).toEqual(r2.map(r => r.finalScore));
  });

  it('TOP 5를 반환', () => {
    const results = matchStartups(baseInput);
    expect(results.length).toBe(5);
  });

  it('finalScore 내림차순 정렬', () => {
    const results = matchStartups(baseInput);
    for (let i = 1; i < results.length; i++) {
      expect(results[i-1].finalScore).toBeGreaterThanOrEqual(results[i].finalScore);
    }
  });

  it('breakdown 4개 점수 합산이 finalScore와 일치', () => {
    const results = matchStartups(baseInput);
    results.forEach(r => {
      const expected =
        r.breakdown.competencyFit * 0.50 +
        r.breakdown.personalityFit * 0.30 +
        r.breakdown.careerSynergy * 0.10 +
        r.breakdown.marketAttractiveness * 0.10;
      expect(r.finalScore).toBeCloseTo(expected, 2);
    });
  });

  it('자본 500만원 vs 3억 → 다른 결과', () => {
    const lowCapital = matchStartups({ ...baseInput, hardFilter: { ...baseInput.hardFilter, capital: 500 } });
    const highCapital = matchStartups({ ...baseInput, hardFilter: { ...baseInput.hardFilter, capital: 30000 } });
    // 저자본은 고투자 아이템이 필터링됨
    expect(lowCapital.map(r => r.item.name)).not.toEqual(highCapital.map(r => r.item.name));
  });

  it('모든 역량 1점 vs 5점 → 다른 TOP 5', () => {
    const low = matchStartups({ ...baseInput, competencyScores: Array(12).fill(1) });
    const high = matchStartups({ ...baseInput, competencyScores: Array(12).fill(5) });
    expect(low.map(r => r.item.name)).not.toEqual(high.map(r => r.item.name));
  });

  it('100ms 이내 완료', () => {
    const start = performance.now();
    matchStartups(baseInput);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('competencyGap은 부족한 역량만 포함', () => {
    const results = matchStartups(baseInput);
    results.forEach(r => {
      r.competencyGap.forEach(gap => {
        expect(gap.userScore).toBeLessThan(gap.requiredScore);
      });
    });
  });
});
```

### 파일: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: { globals: true },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

---

## 검증 체크리스트

```bash
# 1. 테스트 실행
npm test
# → 모든 테스트 통과

# 2. API 테스트 (개발 서버 실행 상태에서)
curl -X POST http://localhost:3000/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "hardFilter": {
      "capital": 5000, "region": "metro", "license": "none",
      "timing": "3m", "family": "single", "income": 300,
      "career": "it", "loan": false
    },
    "competencyScores": [4,3,3,5,2,4,3,4,3,3,2,4],
    "personalityAnswers": ["b","a","b","b","a","a","b","a","b","a"]
  }'
# → { sessionId: "...", results: [...5개...] }

# 3. 다양한 입력으로 결과 변화 확인
# (자본 변경, 역량 변경, 성향 변경 시 TOP 5 달라지는지)
```
