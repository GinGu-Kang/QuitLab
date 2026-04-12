# 🚀 "퇴사하고 뭐하지?" — 단계별 구현 플랜

> **이 문서의 목적**: 코딩 에이전트가 이 프로젝트를 처음부터 끝까지 완벽하게 구현할 수 있도록 하는 마스터 플랜.
> 모든 단계는 순차적으로 실행 가능하며, 각 단계의 산출물과 검증 기준이 명시되어 있음.

---

## 📁 입력 파일 (에이전트가 받는 자료)

1. **`PRD.md`** — 제품 요구사항 정의서 (이 프로젝트의 What/Why)
2. **`startup_guide_v2.xlsx`** — 창업 아이템 DB + 진단 질문 + 매칭 알고리즘 (7개 시트)
3. **`startup_quiz_v4.jsx`** — 기존 프론트엔드 React 컴포넌트 (UI 레퍼런스)
4. **`IMPLEMENTATION_PLAN.md`** — 이 문서 (How)

> ⚠️ **엑셀 파일이 Single Source of Truth**. 질문, 업종, 매칭 로직의 모든 데이터는 엑셀에서 온다.
> JSX의 하드코딩된 더미 데이터는 전부 엑셀로 교체되어야 한다.

---

## 🎯 최종 목표

- 퇴사 고민 직장인이 역량·성향·현실 조건을 진단받고 맞춤 창업 업종 TOP 5를 추천받는 웹 서비스
- Next.js 14 + Supabase + Vercel 기반의 서버리스 아키텍처
- 앱인토스 미니앱 확장 가능한 구조
- 광고 + 이메일 DB 수집으로 수익화

---

## 🏗️ 기술 스택 (확정)

| 영역 | 기술 | 이유 |
|------|------|------|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript | SSR + API Routes 통합 |
| 스타일링 | Tailwind CSS | 기존 JSX의 인라인 스타일을 유틸리티로 마이그레이션 |
| 상태 관리 | Zustand | 진단 진행 상태 (localStorage 자동 영속화) |
| 차트 | Recharts | 레이더 차트, 바 차트 |
| DB | Supabase (PostgreSQL) | 고객 DB만 저장. 엑셀 데이터는 JSON 번들 |
| ORM | Prisma | 타입 안전성 + 마이그레이션 |
| 이메일 | Resend | HTML 이메일 + 무료 3,000통/월 |
| 배포 | Vercel | Next.js 최적화 + 한국 Edge |
| 분석 | GA4 + Google Tag Manager | 전환 퍼널 추적 |
| 광고 | Google AdSense (웹) | 추후 앱인토스 IAA로 확장 |

---

## 📋 전체 로드맵 (10개 단계)

```
[1] 프로젝트 초기 세팅
      ↓
[2] 엑셀 → JSON 시딩 스크립트
      ↓
[3] 데이터베이스 설계 (Prisma + Supabase)
      ↓
[4] 매칭 알고리즘 구현 (엑셀 ⑤ 시트 그대로)
      ↓
[5] 프론트엔드 마이그레이션 (JSX → Next.js App Router)
      ↓
[6] 사용자 플로우 구현 (하드필터 → 역량 → 성향 → 결과)
      ↓
[7] 결과 페이지 고도화 (TOP 5 + GAP + 리스크 + 로드맵)
      ↓
[8] 이메일 수집 + 개인정보 동의 + Resend 발송
      ↓
[9] 광고 + SNS 공유 + SEO
      ↓
[10] 배포 + 테스트 + 관리자 대시보드
```

---

# 🔨 STEP 1: 프로젝트 초기 세팅

## 목표
Next.js 14 프로젝트 생성, 필요 패키지 설치, 기본 구조 잡기

## 실행

### 1-1. 프로젝트 생성
```bash
npx create-next-app@latest quit-to \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd quit-to
```

### 1-2. 의존성 설치
```bash
# 핵심
npm install zustand @prisma/client prisma
npm install recharts
npm install @supabase/supabase-js
npm install resend
npm install xlsx  # 엑셀 파싱용 (빌드타임만)
npm install zod  # 런타임 validation

# UI 보조
npm install clsx tailwind-merge
npm install lucide-react  # 아이콘
npm install react-hot-toast  # 토스트 알림

# 개발 도구
npm install -D @types/node
```

### 1-3. 디렉터리 구조
```
quit-to/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── page.tsx                    # 랜딩
│   │   ├── diagnose/
│   │   │   ├── step-1/page.tsx         # 하드필터
│   │   │   ├── step-2/page.tsx         # 역량진단
│   │   │   ├── step-3/page.tsx         # 성향진단
│   │   │   └── loading/page.tsx        # 분석 중
│   │   ├── ad/page.tsx                 # 광고 재생
│   │   ├── result/[sessionId]/page.tsx # 결과
│   │   ├── admin/page.tsx              # 관리자 대시보드
│   │   ├── api/
│   │   │   ├── diagnose/route.ts       # 매칭 API
│   │   │   ├── contact/route.ts        # 이메일 수집
│   │   │   ├── result/[id]/route.ts    # 결과 조회
│   │   │   └── admin/stats/route.ts    # 관리자 통계
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── diagnose/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── OptionButton.tsx
│   │   ├── result/
│   │   │   ├── Top5Cards.tsx
│   │   │   ├── RadarChart.tsx
│   │   │   ├── CompetencyGap.tsx
│   │   │   ├── RiskWarning.tsx
│   │   │   ├── Roadmap.tsx
│   │   │   └── ComicImage.tsx
│   │   └── ui/                         # 재사용 UI
│   ├── lib/
│   │   ├── matching.ts                 # 매칭 알고리즘 (엑셀 ⑤)
│   │   ├── prisma.ts                   # Prisma 클라이언트
│   │   ├── supabase.ts                 # Supabase 클라이언트
│   │   ├── resend.ts                   # 이메일 클라이언트
│   │   └── crypto.ts                   # 전화번호 암호화
│   ├── data/                           # 빌드 타임 JSON (엑셀 시딩 결과)
│   │   ├── startup-items.json          # 엑셀 ① 129개
│   │   ├── competency-questions.json   # 엑셀 ② 24문항
│   │   ├── hard-filters.json           # 엑셀 ③ 8개 필터
│   │   ├── personality-questions.json  # 엑셀 ④ 10문항
│   │   ├── career-synergy.json         # 엑셀 ⑥ 14×19
│   │   └── competency-guide.json       # 엑셀 ⑦ 12개 지표
│   ├── store/
│   │   └── diagnose-store.ts           # Zustand 진단 상태
│   └── types/
│       └── index.ts                    # TypeScript 타입 정의
├── scripts/
│   └── seed-from-excel.ts              # 엑셀 → JSON 시딩 스크립트
├── public/
├── .env.local
├── .env.example
└── package.json
```

### 1-4. 환경 변수 (.env.example)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://...  # Prisma용

# 암호화
ENCRYPTION_KEY=  # 32바이트 hex (openssl rand -hex 32)

# 이메일
RESEND_API_KEY=

# 분석
NEXT_PUBLIC_GA_ID=

# 광고
NEXT_PUBLIC_ADSENSE_ID=

# AI 이미지 (Phase 3)
OPENAI_API_KEY=
```

## 검증
- [ ] `npm run dev`로 기본 Next.js 페이지 표시
- [ ] 모든 디렉터리 생성됨
- [ ] `.env.example`을 `.env.local`로 복사하고 실제 값 채우기 위한 준비 완료

---

# 🔨 STEP 2: 엑셀 → JSON 시딩 스크립트

## 목표
`startup_guide_v2.xlsx`의 7개 시트를 파싱하여 `src/data/*.json`으로 변환

## 핵심 원칙
- **엑셀이 원본**. JSON은 빌드 타임 산출물
- 엑셀 수정 시 `npm run seed` 한 번이면 모든 JSON 갱신
- 각 JSON은 TypeScript 타입과 엄격히 매핑

## 실행

### 2-1. 스크립트 작성: `scripts/seed-from-excel.ts`

구조:
```typescript
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const wb = XLSX.readFile('startup_guide_v2.xlsx');

// 시트 ① 창업 아이템 DB (Row 5~132, 129개 아이템)
function parseStartupItems() {
  const sheet = wb.Sheets['① 창업 아이템 DB'];
  const rows = XLSX.utils.sheet_to_json(sheet, { range: 4, header: 1 });
  return rows.map((row, idx) => ({
    id: row[0],                    // No.
    category: row[1],              // 카테고리
    name: row[2],                  // 창업 아이템
    coreSkills: row[3],            // 핵심 역량/스킬
    investmentRange: row[4],       // 초기 투자비
    investmentMin: parseInvestmentMin(row[4]),  // "3천~1억" → 3000
    // 12개 역량 점수 (Row 5~16 컬럼)
    competencyScores: {
      analytical: row[5],
      creativity: row[6],
      interpersonal: row[7],
      tech: row[8],
      sales: row[9],
      selfManagement: row[10],
      risk: row[11],
      trend: row[12],
      stamina: row[13],
      finance: row[14],
      leadership: row[15],
      content: row[16],
    },
    // 라이프스타일
    operationType: row[17],        // 운영형태 (현장형/온라인형/복합형/무인형)
    requiredStaff: row[18],        // 필요 인력
    weekendWork: row[19],          // 주말근무
    workLifeBalance: row[20],      // 워라밸 (1~5)
    seasonality: row[21],          // 계절성
    requiredLicense: row[22],      // 필요 자격증/인허가
    // 업종 현실 데이터
    avgMonthlyRevenue: row[23],    // 평균 월매출
    operatingMargin: row[24],      // 영업이익률
    breakeven: row[25],            // 손익분기
    competitionLevel: row[26],     // 경쟁강도 (1~5)
    differentiationRoom: row[27],  // 차별화 여지 (1~5)
    closureRate: row[28],          // 폐업률 (3년)
    growthPotential: row[29],      // 성장 잠재력 (1~5)
    entryBarrier: row[30],         // 진입장벽 (1~5)
  }));
}

// 시트 ② 행동기반 역량진단 (Row 5~28, 24문항 = 12역량 × 2문항)
function parseCompetencyQuestions() {
  const sheet = wb.Sheets['② 행동기반 역량진단'];
  const rows = XLSX.utils.sheet_to_json(sheet, { range: 4, header: 1 });
  return rows.map((row, idx) => ({
    id: idx + 1,
    competency: mapCompetencyName(row[0]),  // "분석적 사고력" → "analytical"
    competencyIndex: getCompetencyIndex(row[0]),  // 0~11
    scenario: row[1],
    options: [
      { score: 5, text: row[2] },
      { score: 4, text: row[3] },
      { score: 3, text: row[4] },
      { score: 2, text: row[5] },
      { score: 1, text: row[6] },
    ],
  }));
}

// 시트 ③ 조건 필터 (8개 하드필터)
function parseHardFilters() {
  // 8개 필터의 로직을 구조화된 JSON으로 변환
  // capital, region, license, timing, family, income, career, loan
}

// 시트 ④ 성향·가치관 진단 (10문항)
function parsePersonalityQuestions() {
  const sheet = wb.Sheets['④ 성향·가치관 진단'];
  const rows = XLSX.utils.sheet_to_json(sheet, { range: 4, header: 1 });
  return rows.map((row, idx) => ({
    id: idx + 1,
    dimension: row[0],              // 성향 차원
    question: row[1],               // 질문
    choiceA: {
      text: row[2],
      favorableCategories: row[4].split(',').map(s => s.trim()),
    },
    choiceB: {
      text: row[3],
      favorableCategories: row[5].split(',').map(s => s.trim()),
    },
  }));
}

// 시트 ⑥ 경력 시너지 매핑 (14직종 × 19카테고리)
function parseCareerSynergy() {
  const sheet = wb.Sheets['⑥ 경력 시너지 매핑'];
  // 2D 매트릭스를 { [job]: { [category]: score } } 형태로
}

// 시트 ⑦ 역량지표 가이드 (12개 역량 정의)
function parseCompetencyGuide() {
  // 각 역량의 정의, 활용 예시, 점수 기준
}

// 실행
function main() {
  const outputs = {
    'startup-items.json': parseStartupItems(),
    'competency-questions.json': parseCompetencyQuestions(),
    'hard-filters.json': parseHardFilters(),
    'personality-questions.json': parsePersonalityQuestions(),
    'career-synergy.json': parseCareerSynergy(),
    'competency-guide.json': parseCompetencyGuide(),
  };
  
  const dataDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  for (const [filename, data] of Object.entries(outputs)) {
    fs.writeFileSync(
      path.join(dataDir, filename),
      JSON.stringify(data, null, 2),
      'utf-8'
    );
    console.log(`✅ Generated ${filename} (${Array.isArray(data) ? data.length : 'N/A'} items)`);
  }
}

main();
```

### 2-2. package.json 스크립트 추가
```json
{
  "scripts": {
    "seed": "tsx scripts/seed-from-excel.ts",
    "prebuild": "npm run seed"
  }
}
```

### 2-3. 유틸리티 함수 구현 필요
- `parseInvestmentMin("3천~1억")` → `3000` (만원 단위)
- `mapCompetencyName("분석적 사고력")` → `"analytical"`
- `getCompetencyIndex("분석적 사고력")` → `0`
- 카테고리 표준화 매핑 (엑셀의 "F&B" ↔ 성향진단의 "음식점" 등)

## 검증
- [ ] `npm run seed` 실행 시 에러 없음
- [ ] `src/data/` 하위에 6개 JSON 파일 생성됨
- [ ] `startup-items.json`에 정확히 129개 아이템
- [ ] `competency-questions.json`에 정확히 24문항
- [ ] `personality-questions.json`에 정확히 10문항
- [ ] `career-synergy.json` 매트릭스 완전성 검증 (14×19 = 266개 값)

---

# 🔨 STEP 3: 데이터베이스 설계

## 목표
Supabase PostgreSQL 테이블 스키마 정의 (Prisma)

## 핵심 원칙
- **엑셀 데이터는 DB에 저장하지 않음** (JSON 번들로 충분)
- DB에는 사용자 생성 데이터만: 진단 결과 + 고객 DB

## 실행

### 3-1. Supabase 프로젝트 생성
1. https://supabase.com에서 프로젝트 생성 (Seoul 리전)
2. `Database URL`, `anon key`, `service role key`를 `.env.local`에 복사

### 3-2. `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// 진단 결과 (익명)
model UserResult {
  id              String   @id @default(cuid())
  sessionId       String   @unique  // 프론트에서 생성한 UUID
  createdAt       DateTime @default(now())
  
  // 입력 데이터 (JSON)
  hardFilterInputs    Json  // { capital, region, license, timing, family, income, career, loan }
  competencyScores    Json  // { analytical: 4.5, creativity: 3.0, ... }
  personalityAnswers  Json  // [{ dimensionIndex: 0, choice: 'a' }, ...]
  
  // 결과 데이터 (JSON)
  top5Results     Json  // [{ itemId, totalScore, breakdown: { competency, personality, career, market } }]
  comicImageUrl   String?
  
  // 메타데이터
  userAgent       String?
  ipHash          String?  // IP는 해싱하여 저장
  
  userContact     UserContact?
}

// 고객 DB (개인정보)
model UserContact {
  id                    String    @id @default(cuid())
  userResultId          String    @unique
  userResult            UserResult @relation(fields: [userResultId], references: [id], onDelete: Cascade)
  
  name                  String
  email                 String
  phoneEncrypted        String    // AES-256 암호화
  phoneHash             String    // 중복 체크용 해시
  
  // 동의 기록 (법적 증거)
  privacyConsent        Boolean   @default(false)
  privacyConsentAt      DateTime?
  marketingConsent      Boolean   @default(false)
  marketingConsentAt    DateTime?
  consentIpHash         String?
  consentUserAgent      String?
  
  // 수신거부
  unsubscribedAt        DateTime?
  unsubscribeToken      String    @unique @default(cuid())
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([email])
  @@index([phoneHash])
}

// 이벤트 로그 (분석용)
model AnalyticsEvent {
  id          String   @id @default(cuid())
  sessionId   String
  eventType   String   // 'landing_view', 'step1_complete', 'ad_watched', 'share_click', etc.
  metadata    Json?
  createdAt   DateTime @default(now())
  
  @@index([sessionId])
  @@index([eventType])
  @@index([createdAt])
}

// 관리자 (관리자 대시보드 접근)
model AdminUser {
  id        String   @id @default(cuid())
  email     String   @unique
  passwordHash String
  createdAt DateTime @default(now())
}
```

### 3-3. 마이그레이션 실행
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3-4. `src/lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 3-5. `src/lib/crypto.ts` (전화번호 암호화)
```typescript
import crypto from 'crypto';

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const ALGO = 'aes-256-gcm';

export function encryptPhone(phone: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptPhone(encoded: string): string {
  const data = Buffer.from(encoded, 'base64');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function hashPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone + KEY.toString()).digest('hex');
}

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + KEY.toString()).digest('hex');
}
```

## 검증
- [ ] Supabase 대시보드에서 4개 테이블 생성 확인
- [ ] Prisma Studio (`npx prisma studio`)에서 테이블 구조 확인
- [ ] 전화번호 암/복호화 테스트 통과

---

# 🔨 STEP 4: 매칭 알고리즘 구현

## 목표
엑셀 ⑤ 매칭 알고리즘 설계 시트의 4단계 로직을 `src/lib/matching.ts`에 1:1 구현

## 핵심 로직 (엑셀 ⑤ 시트 그대로)

### STEP 1: 하드 필터
- **1-1 자본금 필터**: 보유자본(+대출 옵션) < 초기투자비 하한 → 제외
- **1-2 자격증 필터**: 필수 자격증 미보유 → 제외 안 함, 경고 태그만 추가
- **1-3 지역 필터**: 해당 지역 부적합 아이템 → 후순위
- **1-4 퇴사시기 필터**: 즉시 퇴사 + 준비기간 6개월+ 아이템 → 후순위

### STEP 2: 소프트 매칭 (점수 계산)

#### 2-1 역량 적합도 (최대 100점)
```
각 역량 i에 대해:
  gap = |사용자점수[i] - 아이템요구점수[i]|
  점수기여 = (5 - gap) × 가중치
  가중치 = 아이템요구점수[i] 자체  // 요구가 높은 역량일수록 더 중요

total = Σ 점수기여
normalized = (total / max_possible_total) × 100
```

#### 2-2 성향 일치도 (최대 100점)
- 10문항 성향 답변 → 각 답변이 선호하는 카테고리 태그 집계
- 아이템의 카테고리/운영형태/주말근무/워라밸/인력규모가 이 태그와 얼마나 일치하는지
- 일치 비율 × 100

#### 2-3 경력 시너지 (+0~20 보너스)
- 직전 직종과 아이템 카테고리의 엑셀 ⑥ 매트릭스 값 사용
- 값: 0(무관) ~ 4(매우높음) → 보너스 점수로 변환 (× 5)

### STEP 3: 최종 점수
```
finalScore = 
  competencyFit × 0.50 +   // 역량 적합도 50%
  personalityFit × 0.30 +  // 성향 일치도 30%
  careerSynergy × 0.10 +   // 경력 시너지 10%
  marketAttractiveness × 0.10  // 시장 매력도 10%

// 시장 매력도 = 성장잠재력 - 경쟁강도 + 차별화여지 (0~100 정규화)
```

### STEP 4: 결과 반환
- TOP 5 아이템 (finalScore 내림차순)
- 각 아이템의 점수 분해 (breakdown)
- 리스크 경고 (폐업률, 경쟁강도, 계절성)
- 역량 GAP (부족한 역량 목록)

## 구현 파일

### `src/lib/matching.ts`
```typescript
import items from '@/data/startup-items.json';
import careerSynergy from '@/data/career-synergy.json';

export interface DiagnoseInput {
  hardFilter: {
    capital: number;          // 만원
    region: 'metro' | 'city' | 'town' | 'rural';
    license: string;
    timing: 'now' | '3m' | '6m' | '1y';
    family: 'single' | 'dual' | 'sole';
    income: number;           // 만원
    career: string;           // 14개 직종 중 하나
    loan: boolean;
  };
  competencyScores: number[];  // length 12, values 1~5
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
  competencyGap: { competency: string; userScore: number; requiredScore: number }[];
  warningTags: string[];  // 예: ['자격증 필요', '긴 준비기간']
}

export function matchStartups(input: DiagnoseInput): MatchResult[] {
  // STEP 1: 하드 필터
  let candidates = items.filter(item => {
    const effectiveCapital = input.hardFilter.loan 
      ? input.hardFilter.capital + 10000  // 대출 1억 추가
      : input.hardFilter.capital;
    return item.investmentMin <= effectiveCapital;
  });
  
  // STEP 2: 소프트 매칭
  const scored = candidates.map(item => {
    const competencyFit = calcCompetencyFit(input.competencyScores, item);
    const personalityFit = calcPersonalityFit(input.personalityAnswers, item);
    const careerSynergy = calcCareerSynergy(input.hardFilter.career, item.category);
    const marketAttractiveness = calcMarketAttractiveness(item);
    
    const finalScore = 
      competencyFit * 0.50 +
      personalityFit * 0.30 +
      careerSynergy * 0.10 +
      marketAttractiveness * 0.10;
    
    return {
      item,
      finalScore,
      breakdown: { competencyFit, personalityFit, careerSynergy, marketAttractiveness },
      riskWarnings: generateRiskWarnings(item),
      competencyGap: calcCompetencyGap(input.competencyScores, item),
      warningTags: generateWarningTags(item, input),
    };
  });
  
  // STEP 3: 정렬
  scored.sort((a, b) => b.finalScore - a.finalScore);
  
  // STEP 4: TOP 5 반환
  return scored.slice(0, 5);
}

// 각 헬퍼 함수 구현 (엑셀 ⑤ 시트 수식 그대로)
function calcCompetencyFit(userScores: number[], item: StartupItem): number { /* ... */ }
function calcPersonalityFit(answers: string[], item: StartupItem): number { /* ... */ }
function calcCareerSynergy(career: string, category: string): number { /* ... */ }
function calcMarketAttractiveness(item: StartupItem): number { /* ... */ }
function generateRiskWarnings(item: StartupItem): string[] { /* ... */ }
function calcCompetencyGap(userScores: number[], item: StartupItem) { /* ... */ }
function generateWarningTags(item: StartupItem, input: DiagnoseInput): string[] { /* ... */ }
```

### `src/app/api/diagnose/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { matchStartups } from '@/lib/matching';
import { prisma } from '@/lib/prisma';
import { hashIp } from '@/lib/crypto';
import { z } from 'zod';

const schema = z.object({
  hardFilter: z.object({ /* ... */ }),
  competencyScores: z.array(z.number().min(1).max(5)).length(12),
  personalityAnswers: z.array(z.enum(['a', 'b'])).length(10),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.parse(body);
  
  const results = matchStartups(parsed);
  
  // DB에 저장
  const sessionId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  await prisma.userResult.create({
    data: {
      sessionId,
      hardFilterInputs: parsed.hardFilter,
      competencyScores: parsed.competencyScores,
      personalityAnswers: parsed.personalityAnswers,
      top5Results: results,
      userAgent: req.headers.get('user-agent'),
      ipHash: hashIp(ip),
    },
  });
  
  return NextResponse.json({ sessionId, results });
}
```

## 검증
- [ ] 단위 테스트: 동일 입력에 동일 결과 (결정론적)
- [ ] 다양한 입력 조합으로 TOP 5가 실제로 달라지는지 확인
- [ ] 엣지 케이스: 자본 500만원 / 자본 5억 / 모든 역량 1점 / 모든 역량 5점
- [ ] 성능: 100ms 이내 완료

---

# 🔨 STEP 5: 프론트엔드 마이그레이션

## 목표
`startup_quiz_v4.jsx`를 Next.js App Router + TypeScript + Tailwind로 재구성

## 실행

### 5-1. Zustand 스토어: `src/store/diagnose-store.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DiagnoseState {
  // Step 1: Hard Filter
  hardFilter: Partial<HardFilterInput>;
  setHardFilter: (key: string, value: any) => void;
  
  // Step 2: Competency (24 questions)
  competencyAnswers: (number | null)[];  // length 24
  setCompetencyAnswer: (index: number, score: number) => void;
  
  // Step 3: Personality (10 questions)
  personalityAnswers: ('a' | 'b' | null)[];  // length 10
  setPersonalityAnswer: (index: number, choice: 'a' | 'b') => void;
  
  // Meta
  name: string;
  setName: (name: string) => void;
  
  // Navigation
  currentStep: number;
  currentQuestionIndex: number;
  nextQuestion: () => void;
  
  // Computed: 역량별 평균 점수 (12개)
  getCompetencyScores: () => number[];
  
  reset: () => void;
}

export const useDiagnoseStore = create<DiagnoseState>()(
  persist(
    (set, get) => ({ /* ... */ }),
    { name: 'diagnose-storage' }
  )
);
```

### 5-2. 색상 시스템 (Tailwind 확장)
`tailwind.config.ts`에 PRD 디자인 방향 반영:
- 메인: 딥 블루/틸 (신뢰감)
- 포인트: 오렌지/코랄
- 배경: 다크 모드 유지 (기존 JSX 컨셉)

### 5-3. 재사용 컴포넌트
JSX의 인라인 스타일을 Tailwind로 변환:
- `QuestionCard`: 질문 + 선택지
- `OptionButton`: 아이콘 + 텍스트 버튼
- `ProgressBar`: 그라데이션 진행률
- `Button`: primary/secondary/gold 변형

## 검증
- [ ] 모든 화면이 기존 JSX와 시각적으로 유사 또는 개선
- [ ] 모바일 375px에서 깨짐 없음
- [ ] 타입 에러 없음

---

# 🔨 STEP 6: 사용자 플로우 구현

## 목표
PRD의 순서대로 페이지 간 이동 구현

## 플로우
```
/ (랜딩) 
  → /diagnose/step-1 (하드필터 8문항, 엑셀 ③)
  → /diagnose/step-2 (역량진단 24문항, 엑셀 ②)
  → /diagnose/step-3 (성향진단 10문항, 엑셀 ④)
  → /diagnose/loading (분석 과정 시각화)
  → /ad (광고 재생)
  → /result/[sessionId] (결과)
```

## 구현 포인트

### 6-1. 각 페이지는 Zustand에서 이전 단계 완료 여부 확인
- 미완료 시 이전 단계로 리다이렉트

### 6-2. 로딩 페이지 연출 (PRD F-AD-01)
- "129개 업종과 당신의 조건을 대조 중..."
- "역량 적합도 계산 중..."
- "성향 매칭 중..."
- 실제로는 백그라운드에서 `/api/diagnose` POST 호출
- 완료 시 sessionId 받아서 `/ad?sid=xxx`로 이동

### 6-3. 광고 페이지
- Google AdSense 광고 삽입
- 15~30초 카운트다운 (스킵 불가)
- 완료 후 `/result/[sessionId]`로 이동

## 검증
- [ ] 랜딩부터 결과까지 전체 플로우 완주 가능
- [ ] 중간에 새로고침해도 localStorage에 상태 보존
- [ ] 각 단계 진행률 표시 정확

---

# 🔨 STEP 7: 결과 페이지 고도화

## 목표
PRD 4.7 섹션의 결과 페이지 10개 구성 요소를 순서대로 구현

## 구성 (위→아래)

1. **진단 요약** — 12개 역량 점수 한눈에
2. **TOP 5 추천 카드** — 적합도 % + "왜 나한테 맞는지" 한 줄 근거
3. **레이더 차트** — 내 점수 vs 1위 요구 점수 오버레이
4. **1위 업종 심층 분석** — 엑셀 ① 시트의 모든 현실 데이터
5. **역량 GAP 분석** — 바 차트 + 부족 역량 하이라이트
6. **보완 가이드** — 부족 역량별 보완 방법
7. **리스크 경고** — 폐업률/경쟁강도/계절성
8. **실행 로드맵** — D-90 → 개업 → 6개월 후
9. **코믹 이미지** — "10년 뒤 나의 모습" (재미 요소)
10. **공유 + 이메일 수집**

## 검증
- [ ] 모든 10개 요소가 순서대로 표시됨
- [ ] 데이터가 실제 매칭 결과 기반 (하드코딩 없음)
- [ ] 탭 없이 긴 스크롤 형태 또는 탭 유지 결정

---

# 🔨 STEP 8: 이메일 수집 + 개인정보 동의

## 목표
PRD 4.10을 완전히 구현. 법적 리스크 최소화

## 핵심

### 8-1. 동의 UI
- 체크박스 2개 (개인정보 수집 필수 / 마케팅 수신 선택)
- 각 체크박스 옆 "전문 보기" 링크 → 팝업 모달
- 사전 체크 금지

### 8-2. `/api/contact` 엔드포인트
```typescript
POST /api/contact
Body: { sessionId, name, email, phone, privacyConsent, marketingConsent }

처리:
1. sessionId 유효성 확인 (UserResult 존재)
2. 이메일 중복 확인
3. 전화번호 암호화 + 해시
4. UserContact 생성 (동의 시점 IP/UA 기록)
5. Resend로 결과 이메일 발송
6. 성공 응답
```

### 8-3. 이메일 템플릿 (HTML)
- TOP 5 추천 요약
- 1위 업종 상세
- 역량 GAP 간단 버전
- 보완 가이드 링크
- 재방문 CTA
- 수신거부 링크 (마케팅 동의자만)

### 8-4. 수신거부 페이지
`/unsubscribe/[token]` → 토큰 검증 → `unsubscribedAt` 업데이트

## 검증
- [ ] 필수 동의 없이는 제출 불가
- [ ] 전화번호가 DB에 암호화된 형태로만 저장
- [ ] 이메일이 실제로 수신됨
- [ ] 수신거부 링크가 작동함

---

# 🔨 STEP 9: 광고 + SNS 공유 + SEO

## 9-1. Google AdSense
- `/ad` 페이지에 삽입
- 결과 페이지 하단에도 배너

## 9-2. SNS 공유
- 카카오톡 SDK 연동
- 결과 페이지 URL 공유 (sessionId 기반 영구 링크)
- 동적 OG 태그 (Next.js generateMetadata)
- 공유 문구: "퇴사하면 나는 [업종명]이 딱이래 🤔 너는 뭐 나오는지 해봐"

## 9-3. SEO
- 랜딩 페이지: 정적 메타 태그 + JSON-LD
- 결과 페이지: 동적 OG (이름/업종 포함)
- robots.txt + sitemap.xml

## 9-4. GA4 이벤트
- `landing_view`, `step1_start`, `step1_complete`, `step2_complete`, `step3_complete`, `ad_watched`, `result_view`, `share_click_kakao`, `share_click_instagram`, `email_submit`

## 검증
- [ ] Lighthouse 점수: Performance 90+, Accessibility 90+, SEO 95+
- [ ] 공유 시 썸네일/제목/설명 정상 표시
- [ ] GA4 Realtime에서 이벤트 확인

---

# 🔨 STEP 10: 배포 + 관리자 대시보드

## 10-1. Vercel 배포
- GitHub 레포 연결
- 환경 변수 등록
- 커스텀 도메인 설정 (예: quit-to.com)

## 10-2. 관리자 대시보드 `/admin`
- 인증: NextAuth.js (이메일/비밀번호)
- 통계:
  - 전체 참여자 수
  - 일별 참여 추이 (Recharts)
  - 인기 추천 업종 TOP 10
  - 전환 퍼널 (랜딩 → step1 → step2 → step3 → 광고 → 결과 → 이메일)
- 고객 DB:
  - 검색/필터 (이름, 이메일, 동의 여부, 가입일)
  - CSV 내보내기 (마케팅 동의자만)
- 개인정보 처리:
  - 삭제 요청 처리 UI
  - 보관기한 초과 자동 삭제 (Cron)

## 10-3. 모니터링
- Vercel Analytics 활성화
- Sentry 에러 트래킹 (선택)
- Uptime monitoring (UptimeRobot 무료)

## 검증
- [ ] 프로덕션 URL에서 전체 플로우 동작
- [ ] 관리자 로그인 후 실제 수집 데이터 확인
- [ ] 전화번호가 암호화된 형태로 저장됨 확인
- [ ] 수신거부 링크 작동

---

# 🧪 최종 통합 검증 체크리스트

## 기능 검증
- [ ] 랜딩 → 결과 → 이메일 제출 전체 플로우 5분 이내 완주
- [ ] 동일 답변 2회 입력 시 동일 결과 (매칭 결정론적)
- [ ] 다른 답변 입력 시 TOP 5가 유의미하게 달라짐
- [ ] 모든 답변이 매칭에 반영됨 (하드필터/역량/성향/경력 모두)

## 데이터 정확성
- [ ] 엑셀 ① 시트 129개 업종 모두 표시 가능
- [ ] 엑셀 ② 시트 24문항 모두 출제
- [ ] 엑셀 ④ 시트 10문항 모두 출제
- [ ] 엑셀 ⑥ 경력 시너지가 실제로 점수에 반영됨
- [ ] 엑셀 ⑤ 알고리즘의 가중치 (50/30/10/10) 정확히 적용

## 법률 준수
- [ ] 개인정보 처리방침 페이지 존재
- [ ] 이용약관 페이지 존재
- [ ] 수집 동의 팝업 전문 표시
- [ ] 수신거부 링크 작동
- [ ] 14세 미만 이용 제한 고지

## 성능
- [ ] Lighthouse Performance 90+
- [ ] API 응답 < 500ms (p95)
- [ ] 매칭 연산 < 100ms

## 모바일 UX
- [ ] iPhone SE (375px) 깨짐 없음
- [ ] 갤럭시 S 시리즈 테스트
- [ ] 터치 영역 최소 44x44px

---

# 🎨 디자인 가이드 (Tailwind 변환 참고)

## PRD에서 정의한 톤
- 신뢰감 + 따뜻함 + 약간의 유머
- 딥 블루/틸 베이스 + 포인트 오렌지/코랄
- 다크 모드 (기존 JSX 유지)

## 기존 JSX의 색상 상수 (유지)
```
bg: #0A0E1A (배경)
card: #111827 (카드)
teal: #0D9488 / tealG: #14B8A6 (메인)
gold: #F59E0B / goldL: #FCD34D (포인트)
purple: #8B5CF6 (서브)
green: #10B981 (긍정)
red: #EF4444 (경고/부족)
```

## Tailwind 매핑
- `bg-slate-950` ≈ #0A0E1A
- `bg-slate-900` ≈ #111827
- `text-teal-600 / text-teal-400`
- `text-amber-500 / text-amber-300`

---

# 📦 코딩 에이전트 작업 지침

## 규칙
1. **엑셀 데이터 하드코딩 금지** — 반드시 `src/data/*.json`에서 import
2. **매칭 로직은 엑셀 ⑤ 시트 기준** — 임의 수정 금지
3. **타입 안전성** — `any` 금지, Zod로 런타임 검증
4. **에러 핸들링** — try-catch + 사용자 친화적 에러 메시지
5. **환경 변수** — 민감 정보는 절대 하드코딩 금지

## 진행 방식
1. STEP 1부터 순차 진행
2. 각 STEP의 검증 체크리스트를 모두 통과한 뒤 다음 단계로
3. 막히는 부분은 PRD 또는 엑셀 시트를 재확인
4. 기존 JSX는 "UI 레퍼런스"로만 사용 (로직은 재작성)

## 커밋 메시지 컨벤션
```
[STEP N] 기능 요약

예: [STEP 2] 엑셀 → JSON 시딩 스크립트 구현
    [STEP 4] 매칭 알고리즘 STEP 2-1 역량 적합도 계산 구현
```

---

# 📞 문의/참고

- **PRD**: 기능 요구사항, 톤, UX 방향
- **엑셀 (startup_guide_v2.xlsx)**: 모든 데이터의 원본
- **startup_quiz_v4.jsx**: UI 레퍼런스 (로직은 참고하지 말 것)

> ⚠️ **가장 중요한 원칙**: 이 서비스는 "진짜 퇴사 고민하는 사람을 돕는 것"이 목적.
> 바이럴은 결과의 품질이 좋으니 자연스럽게 따라오는 것이어야 한다.
> 분석의 진정성 > 재미 요소 > 공유 유도 순서로 우선순위를 둘 것.

---

**끝.** 이 플랜대로 10단계 완주하면 프로덕션 레벨 서비스가 나온다. 🚀
