# 프론트엔드 디자인 리뉴얼 분할 실행 플랜

- 원본 마스터 문서: [../2026-04-13_frontend-renewal.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal.md)
- 목적: 마스터 플랜을 실제 구현 순서대로 바로 실행할 수 있도록 Phase 단위 파일로 분할
- 원칙: 알고리즘/로직 변경 금지, 순수 디자인/접근성/반응형만 수정

## 실행 순서

1. [Phase 1 랜딩 리디자인](</Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-1-landing-redesign.md>)
2. [Phase 2 컬러 시스템 정리](</Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-2-color-system.md>)
3. [Phase 3 Border-Radius 통일](</Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-3-radius-unification.md>)
4. [Phase 4 진단 스텝 디자인 개선](</Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-4-diagnose-step-design.md>)
5. [Phase 5 결과 페이지 디자인 개선](</Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-5-results-page-design.md>)
6. [Phase 6 반응형 개선](</Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-6-responsive.md>)
7. [Phase 7 접근성 & 마이크로카피](</Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-7-accessibility.md>)

## 공통 완료 조건

- `npm run build` 통과
- `npm run dev`에서 대상 페이지 렌더링 확인
- 모바일 375px 레이아웃 깨짐 없음
- 이전 Phase 회귀 없음

## 명시적 제외 범위

- `src/lib/matching.ts`
- `src/lib/analytics.ts`
- `src/store/diagnose-store.ts`
- `src/app/api/**`
- `prisma/**`
- `scripts/seed-from-excel.ts`
- `src/types/**`
- 데이터 흐름, 이벤트 핸들러, fetch, router 이동, analytics 호출
