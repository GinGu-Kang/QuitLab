# Phase 1: 프로젝트 초기 세팅 + 엑셀 시딩 + 타입 시스템

> **사전 조건**: 없음 (첫 번째 Phase)
> **산출물**: Next.js 14 프로젝트 + 6개 JSON 데이터 파일 + 전체 타입 시스템
> **예상 파일 수**: ~25-30개

---

## 1-1. Next.js 프로젝트 생성

```bash
cd /Users/gangjingu/project/QuitProject
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

> ⚠️ 현재 디렉터리(.)에 생성. 기존 파일(IMPLEMENTATION_PLAN.md, startup_quiz_v4.jsx, startup_guide_v2.xlsx, CLAUDE.md)은 보존.

## 1-2. 의존성 설치

```bash
# 핵심
npm install zustand @prisma/client prisma recharts @supabase/supabase-js resend xlsx zod

# UI 보조
npm install clsx tailwind-merge lucide-react react-hot-toast

# 개발 도구
npm install -D tsx @types/node vitest
```

## 1-3. 디렉터리 구조 생성

```bash
mkdir -p src/{components/{diagnose,result,ui},lib,data,store,types}
mkdir -p src/app/{diagnose/{step-1,step-2,step-3,loading},ad,result/[sessionId],admin,api/{diagnose,contact,result/[id],admin/{stats,auth,export}},unsubscribe/[token],privacy,terms}
mkdir -p prisma scripts public
```

## 1-4. TypeScript 타입 정의

### 파일: `src/types/index.ts`

```typescript
// 엑셀 ① 시트: 창업 아이템 DB (129개)
export interface StartupItem {
  id: number;
  category: string;           // 카테고리 (음식점, 소매/판매, 뷰티/건강 등)
  name: string;               // 창업 아이템명
  coreSkills: string;         // 핵심 역량/스킬
  investmentRange: string;    // 초기 투자비 범위 문자열 (예: "3천~1억")
  investmentMin: number;      // 초기 투자비 하한 (만원 단위)
  competencyScores: CompetencyScoreMap;  // 12개 역량 점수
  // 라이프스타일
  operationType: string;      // 운영형태 (현장형/온라인형/복합형/무인형)
  requiredStaff: string;      // 필요 인력
  weekendWork: string;        // 주말근무
  workLifeBalance: number;    // 워라밸 (1~5)
  seasonality: string;        // 계절성
  requiredLicense: string;    // 필요 자격증/인허가
  // 업종 현실 데이터
  avgMonthlyRevenue: string;  // 평균 월매출
  operatingMargin: string;    // 영업이익률
  breakeven: string;          // 손익분기
  competitionLevel: number;   // 경쟁강도 (1~5)
  differentiationRoom: number; // 차별화 여지 (1~5)
  closureRate: string;        // 폐업률 (3년)
  growthPotential: number;    // 성장 잠재력 (1~5)
  entryBarrier: number;       // 진입장벽 (1~5)
}

// 12개 역량 점수 맵
export interface CompetencyScoreMap {
  analytical: number;         // 분석적 사고력
  creativity: number;         // 창의력
  interpersonal: number;      // 대인관계
  tech: number;               // 기술활용
  sales: number;              // 영업세일즈
  selfManagement: number;     // 자기관리규율
  risk: number;               // 리스크감수
  trend: number;              // 트렌드민감도
  stamina: number;            // 체력지구력
  finance: number;            // 재무관리
  leadership: number;         // 리더십
  content: number;            // 콘텐츠커뮤니케이션
}

// 역량 키 배열 (순서 중요 — 엑셀 컬럼 순서와 일치)
export const COMPETENCY_KEYS: (keyof CompetencyScoreMap)[] = [
  'analytical', 'creativity', 'interpersonal', 'tech', 'sales',
  'selfManagement', 'risk', 'trend', 'stamina', 'finance',
  'leadership', 'content',
];

// 역량 한국어 라벨 (JSX SHORT 배열과 동일)
export const COMPETENCY_LABELS = [
  '분석력', '창의력', '대인관계', '기술활용', '영업력', '자기관리',
  '리스크', '트렌드', '체력', '재무관리', '리더십', '콘텐츠',
];

export const COMPETENCY_ICONS = [
  '🧠', '💡', '🤝', '📱', '💬', '⏰', '🎲', '👀', '💪', '💰', '👑', '📸',
];

// 엑셀 ② 시트: 행동기반 역량진단 (24문항)
export interface CompetencyQuestion {
  id: number;
  competency: keyof CompetencyScoreMap;
  competencyIndex: number;    // 0~11
  scenario: string;           // 시나리오 질문
  options: { score: number; text: string }[];  // 5점~1점
}

// 엑셀 ③ 시트: 조건 필터 (8개 하드필터)
export interface HardFilter {
  id: string;                 // capital, loan, timing, family, income, career, region, license
  question: string;
  options: { text: string; value: string | number; icon: string }[];
}

// 엑셀 ④ 시트: 성향·가치관 진단 (10문항)
export interface PersonalityQuestion {
  id: number;
  dimension: string;          // 성향 차원명
  question: string;
  choiceA: { text: string; favorableCategories: string[] };
  choiceB: { text: string; favorableCategories: string[] };
}

// 엑셀 ⑥ 시트: 경력 시너지 매핑
export type CareerSynergyMatrix = Record<string, Record<string, number>>;
// { [직종키]: { [카테고리]: 시너지점수(0~4) } }

// 엑셀 ⑦ 시트: 역량지표 가이드
export interface CompetencyGuide {
  competency: keyof CompetencyScoreMap;
  competencyIndex: number;
  name: string;               // 한국어 정식 명칭
  definition: string;         // 정의
  examples: string;           // 활용 예시
  scoringCriteria: string;    // 점수 기준
}

// 매칭 알고리즘 입출력
export interface DiagnoseInput {
  hardFilter: {
    capital: number;          // 만원
    region: string;           // metro/city/town/rural
    license: string;          // none/food/beauty/pro/etc
    timing: string;           // now/3m/6m/1y
    family: string;           // single/dual/sole
    income: number;           // 만원
    career: string;           // 14개 직종 키
    loan: boolean;
  };
  competencyScores: number[];   // length 12, values 1~5
  personalityAnswers: ('a' | 'b')[];  // length 10
}

export interface MatchResult {
  item: StartupItem;
  finalScore: number;
  breakdown: {
    competencyFit: number;
    personalityFit: number;
    careerSynergy: number;
    marketAttractiveness: number;
  };
  riskWarnings: string[];
  competencyGap: { competency: string; label: string; userScore: number; requiredScore: number }[];
  warningTags: string[];
}
```

## 1-5. Tailwind 설정 확장

### 파일: `tailwind.config.ts`

JSX의 색상 상수(C 객체)를 Tailwind 커스텀 색상으로 등록:

```typescript
// extend.colors에 추가:
quiz: {
  bg: '#0A0E1A',
  card: '#111827',
  hover: '#1F2A42',
  border: '#1E293B',
  teal: '#0D9488',
  'teal-light': '#14B8A6',
  gold: '#F59E0B',
  'gold-light': '#FCD34D',
  purple: '#8B5CF6',
  pink: '#EC4899',
  green: '#10B981',
  text: '#F1F5F9',
  'text-secondary': '#94A3B8',
  'text-dim': '#64748B',
}
```

## 1-6. 글로벌 CSS

### 파일: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');

body {
  font-family: 'Pretendard Variable', 'Apple SD Gothic Neo', sans-serif;
  background: #0A0E1A;
  color: #F1F5F9;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## 1-7. 루트 레이아웃

### 파일: `src/app/layout.tsx`

- Pretendard 폰트
- 메타데이터: title "퇴사하면 나는 어떤 가게 사장님?", description
- viewport: width=device-width, initial-scale=1
- body: min-h-screen bg-quiz-bg text-quiz-text

## 1-8. 엑셀 → JSON 시딩 스크립트

### 파일: `scripts/seed-from-excel.ts`

핵심 로직:

```typescript
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const wb = XLSX.readFile(path.join(__dirname, '../startup_guide_v2.xlsx'));

// 역량명 매핑 테이블
const COMPETENCY_MAP: Record<string, string> = {
  '분석적 사고력': 'analytical', '분석적사고력': 'analytical',
  '창의력': 'creativity',
  '대인관계': 'interpersonal', '대인관계력': 'interpersonal',
  '기술활용': 'tech', '기술활용력': 'tech',
  '영업세일즈': 'sales', '영업/세일즈': 'sales',
  '자기관리규율': 'selfManagement', '자기관리/규율': 'selfManagement',
  '리스크감수': 'risk', '리스크 감수': 'risk',
  '트렌드민감도': 'trend', '트렌드 민감도': 'trend',
  '체력지구력': 'stamina', '체력/지구력': 'stamina',
  '재무관리': 'finance',
  '리더십': 'leadership',
  '콘텐츠커뮤니케이션': 'content', '콘텐츠/커뮤니케이션': 'content',
};

// 투자비 문자열 파싱
function parseInvestmentMin(str: string): number {
  // "3천~1억" → 3000, "500~2천" → 500, "0~100" → 0
  // 하한값(~ 앞부분)을 만원 단위로 변환
  const lower = str.split('~')[0].trim();
  if (lower.includes('억')) {
    return parseFloat(lower.replace('억', '')) * 10000;
  }
  if (lower.includes('천')) {
    return parseFloat(lower.replace('천', '')) * 1000;
  }
  return parseFloat(lower) || 0;
}
```

각 시트 파싱 함수:

1. `parseStartupItems()` — ① 시트, Row 5~132 (range: 4), 129개
2. `parseCompetencyQuestions()` — ② 시트, Row 5~28, 24문항
3. `parseHardFilters()` — ③ 시트, 8개 필터 → JSON 구조화
4. `parsePersonalityQuestions()` — ④ 시트, Row 5~14, 10문항
5. `parseCareerSynergy()` — ⑥ 시트, 14×19 매트릭스
6. `parseCompetencyGuide()` — ⑦ 시트, 12개 역량 정의

### 주의사항
- 시트명이 한국어 + 번호: `wb.Sheets['① 창업 아이템 DB']`
- `XLSX.utils.sheet_to_json(sheet, { range: 4, header: 1 })` 로 Row 5부터 파싱
- 빈 셀, 숫자/문자 혼합 처리
- 만약 시트명을 찾지 못할 경우, `wb.SheetNames`를 출력하여 실제 시트명 확인 후 매핑

## 1-9. package.json 스크립트

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "tsx scripts/seed-from-excel.ts",
    "prebuild": "npm run seed",
    "test": "vitest"
  }
}
```

## 1-10. 환경 변수

### 파일: `.env.example`

```env
# Supabase (Phase 3에서 설정)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=

# 암호화 (Phase 3에서 설정)
ENCRYPTION_KEY=

# 이메일 (Phase 6에서 설정)
RESEND_API_KEY=

# 분석 (Phase 7에서 설정)
NEXT_PUBLIC_GA_ID=

# 광고 (Phase 7에서 설정)
NEXT_PUBLIC_ADSENSE_ID=
```

---

## 검증 체크리스트

```bash
# 1. 개발 서버 동작
npm run dev
# → http://localhost:3000 접속 확인

# 2. 엑셀 시딩
npm run seed
# → 에러 없이 6개 파일 생성 확인

# 3. 데이터 무결성
node -e "const d=require('./src/data/startup-items.json'); console.log('아이템:', d.length)"
# → 129

node -e "const d=require('./src/data/competency-questions.json'); console.log('역량질문:', d.length)"
# → 24

node -e "const d=require('./src/data/personality-questions.json'); console.log('성향질문:', d.length)"
# → 10

# 4. 타입 체크
npx tsc --noEmit
```
