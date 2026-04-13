# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"퇴사하고 뭐하지?" — A web service that diagnoses working professionals' competencies, personality traits, and real-world conditions to recommend personalized TOP 5 startup business types.

**Language**: Korean (all UI text, questions, data labels are in Korean)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **State Management**: Zustand (with localStorage persistence)
- **Charts**: Recharts (radar charts, bar charts)
- **Database**: Supabase (PostgreSQL) via Prisma ORM — stores only user-generated data (results, contacts)
- **Email**: Resend
- **Validation**: Zod
- **Deployment**: Vercel

## Key Data Architecture

**Excel is the single source of truth.** The file `startup_guide_v2.xlsx` contains 7 sheets with all questions, business items, and matching logic. All hardcoded dummy data in `startup_quiz_v4.jsx` must be replaced with data seeded from the Excel file.

The 7 Excel sheets:
1. ① 창업 아이템 DB — 129 startup items with 12 competency scores and market data
2. ② 행동기반 역량진단 — 24 questions (12 competencies × 2 questions each)
3. ③ 조건 필터 — 8 hard filters (capital, region, license, timing, etc.)
4. ④ 성향·가치관 진단 — 10 binary-choice personality questions
5. ⑤ 매칭 알고리즘 설계 — Scoring formula and weights
6. ⑥ 경력 시너지 매핑 — 14 job types × 19 categories matrix
7. ⑦ 역량지표 가이드 — Definitions for 12 competency indicators

**Data flow**: `startup_guide_v2.xlsx` → `npm run seed` → `src/data/*.json` (build-time static) → consumed by matching algorithm and frontend.

## Build & Development Commands

```bash
npx create-next-app@latest quit-to --typescript --tailwind --app --src-dir --import-alias "@/*"
npm run dev          # Start dev server
npm run seed         # Parse Excel → JSON (tsx scripts/seed-from-excel.ts)
npm run build        # Runs seed as prebuild, then builds
npx prisma migrate dev --name <name>   # Run DB migrations
npx prisma generate  # Generate Prisma client
npx prisma studio    # Visual DB browser
```

## Matching Algorithm (`src/lib/matching.ts`)

The algorithm follows Excel sheet ⑤ exactly — do not deviate from these weights:

1. **Hard filter**: Capital + loan → exclude items above budget; license/region/timing → warning tags only
2. **Competency fit (50%)**: Weighted gap calculation across 12 competencies; higher-required competencies carry more weight
3. **Personality fit (30%)**: Category tag overlap from 10 binary-choice answers
4. **Career synergy (10%)**: Lookup from ⑥ matrix (0–4 scale × 5 = 0–20 bonus)
5. **Market attractiveness (10%)**: `growthPotential - competitionLevel + differentiationRoom` (normalized 0–100)

Final score = competencyFit×0.50 + personalityFit×0.30 + careerSynergy×0.10 + marketAttractiveness×0.10

## User Flow

Landing → Step 1 (Hard Filters) → Step 2 (24 competency questions) → Step 3 (10 personality questions) → Loading/Ad → Result page (TOP 5 with breakdown, radar chart, competency gaps, risk warnings, roadmap)

## Key Files

- `IMPLEMENTATION_PLAN.md` — Master implementation plan with all 10 steps, schema definitions, and verification checklists
- `startup_quiz_v4.jsx` — Legacy React component (UI reference only; dummy data must be replaced)
- `startup_guide_v2.xlsx` — Source of truth for all business data and questions
- `plans/` — Legacy public documentation path that must remain available for existing GitHub links
- `docs/plan/` — Working copy of the phase plan docs; phase files here must stay mirrored to `plans/`

## Important Conventions

- The 12 competency names (Korean): 분석적사고력, 창의력, 대인관계, 기술활용, 영업세일즈, 자기관리규율, 리스크감수, 트렌드민감도, 체력지구력, 재무관리, 리더십, 콘텐츠커뮤니케이션
- Phone numbers must be AES-256-GCM encrypted before storage; IPs must be SHA-256 hashed
- Privacy consent and marketing consent are recorded separately with timestamps (legal requirement)
- Competency scores: each competency has 2 questions, averaged to get final 1–5 score per competency
- `plans/` paths are externally referenced; do not remove, rename, or relocate them
- Run `npm run verify:repo` after doc moves/renames; `build` and `test` now enforce this automatically



코드를 작성하기 전에 반드시 계획을 수립하고 승인을 받아라.

예외: 사용자가 요청에 바로시작이라고 명시하면 research/plan/사전 승인 단계를 생략하고 즉시 실행한다. 이 예외는 해당 문구가 포함된 요청에만 적용한다.

전체 규칙: .agent/rules/development-workflow.md

작업 5단계 (반드시 순서 준수)
Phase	내용	산출물 (파일명 규칙)
1. 리서치	관련 코드 깊이 분석	docs/research/YYYY-MM-DD_작업명.md
2. 계획	구현 계획 상세 작성	docs/plan/YYYY-MM-DD_작업명.md
3. 승인	사용자 검토 및 승인 대기	승인 전 코드 작성 절대 금지
4. 구현	승인된 plan 기계적 이행	기능 단위 커밋 + docs/changelog.md 항목 추가
5. 조정	방향 이탈 시 즉시 중단·보고	필요 시 Phase 2부터 재시작

research/plan은 작업마다 날짜+작업명으로 새 파일 생성. 덮어쓰기 금지.

복잡도 기준
- 소규모 (파일 1-2개): Phase 2 간소화 가능
- 중규모 (파일 3-5개): 전체 워크플로우 필수
- 대규모 (파일 5개+): 하위 작업 분할, 각각 별도 plan + 커밋
