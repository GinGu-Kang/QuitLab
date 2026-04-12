# 구현 플랜 — 7개 Phase로 분할

IMPLEMENTATION_PLAN.md의 10단계를 AI가 세션 단위로 실행 가능한 7개 Phase로 재구성.

## Phase 의존성 그래프

```
Phase 1 (세팅+시딩)
  ├── Phase 2 (매칭 알고리즘) ──── Phase 3 (DB) ──┐
  │        │                                       │
  └── Phase 4 (퀴즈 UI) ────── Phase 5 (결과 핵심) │
                                    │              │
                                    └── Phase 6 (결과 확장) ←─┘
                                          │
                                    Phase 7 (SEO+관리자+배포)
```

## Phase 요약

| Phase | 파일 | 내용 | 사용자 액션 |
|-------|------|------|------------|
| [1](PHASE-1-setup-and-seeding.md) | ~25-30 | 프로젝트 생성, 엑셀→JSON, 타입 | 없음 |
| [2](PHASE-2-matching-algorithm.md) | ~10-15 | 매칭 알고리즘, API, 테스트 | 없음 |
| [3](PHASE-3-database.md) | ~10-12 | Prisma, Supabase, 암호화 | **Supabase 셋업** |
| [4](PHASE-4-quiz-flow-ui.md) | ~20-25 | 랜딩~로딩 전체 UI | 없음 |
| [5](PHASE-5-results-core.md) | ~12-15 | 결과 추천+분석근거 탭 | 없음 |
| [6](PHASE-6-results-extended.md) | ~15-18 | 결과 가이드+미래+이메일 | **Resend 셋업** |
| [7](PHASE-7-seo-admin-deploy.md) | ~15-20 | SEO, GA4, 관리자, 배포 | **GA4/Vercel** |

## 실행 순서

1. **Phase 1 → 2 → 4**: 외부 서비스 없이 진행 가능 (프론트 + 알고리즘)
2. **Phase 3**: Supabase 셋업 후 진행
3. **Phase 5**: 1+2+4 완료 후 진행
4. **Phase 6**: 3+5 완료 + Resend 셋업 후 진행
5. **Phase 7**: 모든 기능 완료 후 프로덕션 배포

## 커밋 컨벤션

```
[Phase N] 기능 요약

예: [Phase 1] 프로젝트 초기 세팅 + 엑셀 시딩 스크립트
    [Phase 2] 매칭 알고리즘 + 단위 테스트
    [Phase 4] 퀴즈 플로우 UI (랜딩~광고)
```

## 핵심 원칙 (IMPLEMENTATION_PLAN에서)

1. **엑셀 데이터 하드코딩 금지** — 반드시 `src/data/*.json`에서 import
2. **매칭 로직은 엑셀 ⑤ 시트 기준** — 임의 수정 금지 (50/30/10/10)
3. **타입 안전성** — `any` 금지, Zod로 런타임 검증
4. **기존 JSX는 UI 레퍼런스만** — 로직은 재작성
5. **분석의 진정성 > 재미 요소 > 공유 유도**
