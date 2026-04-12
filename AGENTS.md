# AGENTS.md

이 문서는 이 저장소에서 작업하는 코딩 에이전트용 운영 가이드다.
Codex, Claude Code, Cursor Agent 같은 도구가 이 프로젝트를 빠르게 이해하고 안전하게 수정할 수 있도록 작성했다.

## 1. 프로젝트 개요

서비스명:

- `퇴사하고 뭐하지?`

목적:

- 직장인이 자신의 역량, 성향, 현실 조건을 입력하면 맞춤형 창업 업종 TOP 5를 추천하는 웹 서비스

주요 사용자 플로우:

1. 랜딩
2. Step 1 현실 조건 입력
3. Step 2 역량 진단 24문항
4. Step 3 성향 진단 10문항
5. 로딩
6. 광고
7. 결과 페이지
8. 이메일 저장
9. 관리자 페이지

언어:

- UI와 데이터 라벨은 기본적으로 한국어

## 2. 핵심 원칙

### 엑셀이 원본이다

가장 중요한 규칙:

- `startup_guide_v2.xlsx`가 single source of truth다.
- 질문, 업종, 경력 시너지, 역량 가이드, 매칭 기준은 가능하면 엑셀 기준으로 유지해야 한다.
- `src/data/*.json`은 빌드 타임 산출물이다.
- 엑셀 수정 후에는 반드시 `npm run seed`를 다시 돌려야 한다.

즉:

- JSON을 직접 손대기보다 `scripts/seed-from-excel.ts`를 수정하는 쪽이 우선이다.

### 결과는 설명 가능해야 한다

이 서비스의 추천 결과는 블랙박스 AI가 아니라 규칙 기반 추천 엔진이다.
따라서 변경 시 다음을 유지해야 한다.

- 왜 이 업종이 추천됐는지 설명 가능할 것
- 어떤 조건 때문에 감점됐는지 설명 가능할 것
- 어떤 역량이 부족한지 보여줄 수 있을 것

### 결정론성을 유지한다

같은 입력이면 같은 결과가 나와야 한다.

- 랜덤 추천 금지
- 시간 기반 추천 변경 금지
- 외부 API 응답에 따라 추천이 달라지는 구조 금지

## 3. 기술 스택

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Zustand
- Recharts
- Prisma
- Supabase
- Resend
- Zod
- Vitest
- Playwright

## 4. 현재 코드 구조

중요 디렉터리:

- `src/app`
  - 라우트, 페이지, API 엔드포인트
- `src/components`
  - UI와 결과 페이지 컴포넌트
- `src/lib`
  - 매칭 알고리즘, 저장소, 암호화, 인증, 유틸
- `src/data`
  - 엑셀에서 시딩된 JSON
- `src/store`
  - 진단 상태 관리
- `src/types`
  - 도메인 타입
- `scripts`
  - 시딩, Playwright 검증, 스크린샷 자동화
- `prisma`
  - Prisma 스키마
- `알고리즘`
  - 알고리즘 분석 문서

중요 파일:

- `src/lib/matching.ts`
- `src/lib/repository.ts`
- `src/lib/validation.ts`
- `src/store/diagnose-store.ts`
- `scripts/seed-from-excel.ts`
- `startup_guide_v2.xlsx`
- `IMPLEMENTATION_PLAN.md`
- `CLAUDE.md`
- `알고리즘/리서치.md`

## 5. 실행 명령어

기본:

```bash
npm install
npm run dev
npm run seed
npm run build
npm test
npm run lint
```

Prisma:

```bash
npx prisma generate
npx prisma migrate dev --name <name>
```

검증 스크립트:

```bash
node scripts/verify-ui-flow-playwright.cjs
node scripts/verify-diversity-playwright.cjs
node scripts/capture-all-screens.cjs
node scripts/capture-admin-screens.cjs
```

## 6. 현재 구현상 중요한 동작

### 저장소 계층은 fallback이 있다

`src/lib/repository.ts`는 두 모드로 동작한다.

1. Prisma 사용 가능
2. 로컬 JSON fallback 사용

fallback 파일:

- `.local-data/storage.json`

의미:

- 로컬 개발에서는 DB 환경변수가 없어도 동작해야 한다.
- 에이전트는 개발 중 DB가 없다고 바로 막히지 말고 fallback 구조를 유지해야 한다.

### 관리자 로컬 계정이 있다

개발 환경에서 기본 관리자 계정:

- email: `admin@local.dev`
- password: `admin1234!`

이 값은 개발 편의용이다.
운영 로직을 바꿀 때 이 계정이 깨지면 로컬 검증이 번거로워진다.

### 로딩 페이지는 강제 리다이렉트로 넘어간다

`src/app/diagnose/loading/page.tsx`는 과거에 라우터 전환 문제로 멈춤 현상이 있었다.
현재는 API 성공 후 일정 시간 뒤:

- `window.location.replace('/ad?sid=...')`

로 넘긴다.

이 부분은 함부로 `router.replace()` 기반으로 되돌리지 말 것.

## 7. 데이터 모델 요약

### 입력

- 현실 조건 8개
- 역량 점수 12개
- 성향 답변 10개

### 업종 데이터

업종 항목에는 다음 정보가 포함된다.

- 카테고리
- 업종명
- 핵심 역량
- 투자비
- 12개 역량 점수
- 운영형태
- 필요 인력
- 주말근무
- 워라밸
- 계절성
- 자격증
- 평균 월매출
- 영업이익률
- 손익분기
- 경쟁강도
- 차별화 여지
- 폐업률
- 성장 잠재력
- 진입장벽

## 8. 매칭 알고리즘 요약

실제 구현 파일:

- `src/lib/matching.ts`

현재 알고리즘 흐름:

1. 하드 필터
   - 자본금 부족 업종 제외
   - 자격증은 경고
   - 지역, 퇴사시기, 가족상황, 희망수입은 감점
2. 역량 적합도 계산
   - 12개 역량 gap 기반
   - 요구 점수가 높은 역량일수록 가중치 증가
3. 성향 적합도 계산
   - 성향 답변과 업종 태그 매칭
4. 경력 시너지 계산
   - 경력 × 카테고리 매트릭스 조회
5. 시장 매력도 계산
   - 성장잠재력, 경쟁강도, 차별화 여지 조합
6. 최종 점수 계산 후 TOP 5 반환

현재 구현 분석 문서:

- `알고리즘/리서치.md`

주의:

- 계획 문서와 현재 구현 사이에 일부 차이가 있다.
- 특히 경력 시너지 스케일과 성향 태그 매칭 방식은 현재 구현을 먼저 보고 수정해야 한다.

## 9. UI 수정 시 주의사항

### 이 프로젝트의 시각 언어를 유지한다

기본 톤:

- 다크 배경
- 틸, 골드, 퍼플, 핑크 중심 포인트 컬러
- 한국어 카피 중심
- 모바일 우선 카드 레이아웃

UI 변경 시 지켜야 할 것:

- `quiz` 커스텀 색상 체계 유지
- 375px 모바일에서 깨지지 않게 유지
- 결과 페이지 4탭 구조 유지
- 진단 플로우에서 버튼 텍스트와 단계 문구를 함부로 바꾸지 말 것

### 컴포넌트 재사용 우선

새 버튼/입력 UI를 만들기 전에 먼저 확인:

- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/ProgressBar.tsx`
- `src/components/ui/SectionCard.tsx`

## 10. API 수정 시 주의사항

### 입력 검증을 빼지 말 것

API는 항상 `zod` 스키마를 유지해야 한다.

관련 파일:

- `src/lib/validation.ts`

### 응답 구조를 함부로 바꾸지 말 것

다음 API는 프론트와 직접 결합돼 있다.

- `POST /api/diagnose`
- `GET /api/result/[id]`
- `POST /api/contact`
- `POST /api/analytics`
- `POST /api/admin/auth`

응답 필드 이름을 바꾸면 클라이언트 흐름이 바로 깨질 수 있다.

## 11. 테스트와 검증 규칙

코드 수정 후 기본 검증:

```bash
npm test
npm run lint
npm run build
```

플로우 관련 수정 후 추가 검증:

```bash
node scripts/verify-ui-flow-playwright.cjs
```

매칭 로직 관련 수정 후 추가 검증:

```bash
node scripts/verify-diversity-playwright.cjs
```

목표:

- 최소 8개 이상의 서로 다른 1위 결과가 나와야 한다.

현재 검증 기준:

- 고정 시나리오 40개 기준 15개 서로 다른 1위 결과 확인

## 12. 수정 우선순위

작업할 때 우선순위는 다음과 같다.

1. 엑셀 원본과 타입 정합성
2. 사용자 플로우가 끊기지 않는 것
3. 추천 결과의 설명 가능성
4. 모바일 UI 안정성
5. 관리자/이메일/분석 부가 기능

즉:

- 예쁜 리팩터링보다 동작 보존이 우선
- 구조 변경보다 플로우 안정성이 우선

## 13. 금지사항

다음은 피해야 한다.

- `src/data/*.json`을 수동으로 임의 수정하고 시딩 로직은 방치하는 것
- 추천 로직에 랜덤성 넣는 것
- 로딩 페이지 전환을 다시 불안정하게 바꾸는 것
- 결과 페이지의 점수 분해나 근거 데이터를 숨기는 것
- 운영 환경 의존 기능을 fallback 없이 강제하는 것
- 한국어 질문/카피를 영문 중심으로 바꾸는 것

## 14. 작업 체크리스트

이 저장소에서 기능을 수정할 때는 보통 아래 순서를 따른다.

1. 엑셀 원본 또는 관련 JSON 구조 확인
2. 타입 확인
3. 알고리즘 또는 API 영향 범위 확인
4. UI 영향 범위 확인
5. 테스트 실행
6. 플레이그라이트 흐름 검증

## 15. 에이전트에게 기대하는 행동

좋은 수정:

- 작은 변경이어도 전체 흐름을 깨지 않는지 본다
- 매칭 결과 다양성과 결정론성을 둘 다 확인한다
- 필요하면 스크린샷이나 Playwright 검증까지 같이 남긴다
- 구현과 문서가 다르면 둘 중 무엇이 기준인지 명시한다

나쁜 수정:

- 화면만 바꾸고 API나 저장 구조는 확인하지 않는다
- 알고리즘 숫자를 바꾸고 검증하지 않는다
- build/test/lint 없이 끝냈다고 판단한다

## 16. 참고 문서

- `IMPLEMENTATION_PLAN.md`
- `plans/PHASE-1-setup-and-seeding.md`
- `plans/PHASE-2-matching-algorithm.md`
- `plans/PHASE-3-database.md`
- `plans/PHASE-4-quiz-flow-ui.md`
- `plans/PHASE-5-results-core.md`
- `plans/PHASE-6-results-extended.md`
- `plans/PHASE-7-seo-admin-deploy.md`
- `CLAUDE.md`
- `알고리즘/리서치.md`

---

이 문서는 현재 구현 상태를 기준으로 작성됐다.
구조나 동작 원리가 바뀌면 `AGENTS.md`도 함께 업데이트해야 한다.
