# 2026-05-02 현재 개발 상태 리서치

- 작성일: 2026-05-02
- 범위: 현재 워크트리 기준 실제 구현 상태
- 기준: `src/app`, `src/components`, `src/lib`, `prisma`, `scripts`, 기존 리서치/플랜 문서 교차 확인

## 한줄 결론

현재 코드베이스는 초기 MVP 단계를 넘어, 진단 서비스 본편과 결과 페이지, 저장소 fallback, 관리자 로그인/통계, 고객 목록, 마스터 데이터 release CMS까지 구현된 상태다.
개발 단계로 보면 `Phase 8 (DB source of truth + release CMS)`까지 기능 구현이 들어와 있고, 남은 일은 `운영 보안 하드닝`, `배포 마감 자동화`, `광고/이메일 실운영 연결`, `E2E 안정화` 쪽에 더 가깝다.

## 현재 스냅샷

| 항목 | 현재 상태 |
| --- | --- |
| 사용자 플로우 | 랜딩 → Step1 → Step2 → Step3 → 로딩 → 광고 → 결과 → 이메일 저장까지 연결됨 |
| 추천 엔진 | 규칙 기반 매칭 엔진 구현 완료, 결정론성 테스트 존재 |
| 마스터 데이터 | Excel seed + JSON fallback + published release snapshot 구조 구현 |
| 관리자 기능 | 로그인, 대시보드, 고객 목록, CSV export, release 관리, catalog CMS 구현 |
| 저장소 계층 | Prisma 사용 가능 시 DB, 불가 시 `.local-data/storage.json` fallback |
| 검증 체계 | Vitest 3개, Playwright 검증/캡처 스크립트 다수 존재 |
| 현재 개발 판정 | “서비스 운영 가능 직전 단계”, 다만 운영 하드닝은 일부 미완 |

수치 기준으로는 현재 코드에 아래가 확인된다.

- 앱 파일: 36개
- 컴포넌트 파일: 35개
- 라이브러리 파일: 23개
- 운영/검증 스크립트: 14개
- Prisma migration: 1개
- 마스터 데이터 기본 볼륨: 업종 129개, 역량 문항 24개, 현실 조건 8개, 성향 문항 10개, 경력 축 14개, 역량 가이드 12개

## 단계별 진척 판단

| 로드맵 단계 | 판단 | 근거 |
| --- | --- | --- |
| Phase 1. 프로젝트 세팅 | 완료 | Next.js 14 App Router, Tailwind, Zustand, Prisma, Recharts, Zod, Resend, Playwright, Vitest 구성됨 |
| Phase 2. Excel → JSON 시딩 | 완료 | `scripts/seed-from-excel.ts`, `src/data/*.json` 존재 |
| Phase 3. DB 설계 | 완료 | `prisma/schema.prisma`에 결과, 연락처, 분석, 관리자, master data release 모델 존재 |
| Phase 4. 매칭 알고리즘 | 완료 | `src/lib/matching.ts` 구현, 결정론성/하드필터 테스트 존재 |
| Phase 5. 프론트엔드 마이그레이션 | 완료 | 랜딩/진단/결과/약관/관리자 라우트 전반 구현 |
| Phase 6. 사용자 플로우 | 완료 | 로컬 상태 저장, 로딩 페이지, 광고 대기, 결과 조회까지 연결됨 |
| Phase 7. 결과 고도화 + SEO/Admin | 대부분 완료 | 결과 4탭, 공유, 이메일 저장, sitemap, 관리자 통계/고객목록 구현 |
| Phase 8. DB source of truth + CMS | 구현 완료 | release draft/publish/rollback, catalog CMS, validation, snapshot 구조 구현 |
| Phase 9. 운영 연결 | 부분 완료 | GA/analytics/event 저장은 있음, 광고/이메일은 placeholder 또는 운영 설정 의존 |
| Phase 10. 배포 마감 품질 | 부분 완료 | lint/test/build 체계는 있으나 운영 보안/env 하드닝과 E2E 게이트 안정화 필요 |

## 실제로 구현된 것

### 1. 사용자 진단 서비스 본편은 닫혀 있다

대표 파일:

- `src/app/page.tsx`
- `src/app/diagnose/step-1/page.tsx`
- `src/app/diagnose/step-2/page.tsx`
- `src/app/diagnose/step-3/page.tsx`
- `src/app/diagnose/loading/page.tsx`
- `src/app/ad/page.tsx`
- `src/app/result/[sessionId]/page.tsx`

확인된 상태:

- 랜딩 CTA에서 진단 플로우 시작 가능
- Step 1/2/3는 각각 published master data를 읽어 렌더링
- 로딩 페이지는 API 완료 후 `window.location.replace('/ad?sid=...')`로 강제 이동
- 광고 페이지는 15초 카운트다운 후 결과 페이지 진입
- 결과 페이지는 세션 ID 기준 서버 조회 후 렌더링

즉, 핵심 퍼널 자체는 “페이지 조각” 수준이 아니라 실제 엔드투엔드 흐름으로 연결돼 있다.

### 2. 추천 엔진은 규칙 기반으로 구현돼 있다

대표 파일:

- `src/lib/matching.ts`
- `src/app/api/diagnose/route.ts`
- `src/lib/matching-engine.ts`

확인된 상태:

- 하드 필터: 자본금/대출, 자격증, 지역, 시기, 가족상황, 희망수입 반영
- 역량 적합도: 12개 역량 gap 기반 가중 계산
- 성향 적합도: 10개 문항의 favorable tag 매칭
- 경력 시너지: 카테고리별 matrix lookup
- 시장 매력도: 성장잠재력, 경쟁강도, 차별화 여지 조합
- 결과 저장 시 `masterDataReleaseId`, `masterDataVersion`, `matchingEngineVersion` 함께 기록

현재 엔진 버전 상수도 `phase-8-release-cms-v1`로 분리돼 있어, 결과 재현성 관리까지 고려한 상태다.

### 3. 결과 페이지는 MVP를 넘어서 설명형 구조까지 들어와 있다

대표 컴포넌트:

- `result/Top5Cards.tsx`
- `result/RadarChart.tsx`
- `result/WhyRecommended.tsx`
- `result/CompetencyGap.tsx`
- `result/ScoreBreakdown.tsx`
- `result/StartupGuide.tsx`
- `result/FutureVision.tsx`
- `result/EmailCollector.tsx`

확인된 상태:

- 4탭 구조 유지
- TOP 5 추천과 1위 요약 제공
- 사용자 점수 vs 요구 점수 시각화
- 추천 이유, 부족 역량, 리스크, 비용 구조, 로드맵, 미래 시나리오 제공
- 결과 공유와 이메일 저장 폼 제공

즉, “추천만 보여주는 페이지”가 아니라 설명 가능성과 후속 액션까지 고려한 결과 UX가 이미 구현돼 있다.

### 4. 저장소 계층과 fallback 구조가 실전 수준으로 분기돼 있다

대표 파일:

- `src/lib/repository.ts`
- `src/lib/prisma.ts`
- `src/lib/master-data.ts`

확인된 상태:

- Prisma 사용 가능 시 DB 저장
- Prisma 미사용 또는 일부 스키마 부재 시 `.local-data/storage.json` fallback
- 결과, 연락처, 분석 이벤트, 관리자 계정, master data release까지 fallback 구조 보유
- 공개 앱은 published release snapshot을 우선 조회하고, 없으면 JSON fallback 사용

이 구조 덕분에 로컬 개발은 강하고, 동시에 Phase 8 이후 DB 전환 구조도 수용하고 있다.

### 5. 관리자 기능은 통계 페이지를 넘어 CMS 단계까지 구현돼 있다

대표 파일:

- `src/app/admin/page.tsx`
- `src/app/admin/customers/page.tsx`
- `src/app/admin/releases/page.tsx`
- `src/app/admin/catalog/page.tsx`
- `src/app/admin/catalog/[id]/page.tsx`
- `src/app/admin/catalog/new/page.tsx`
- `src/lib/master-data-admin.ts`

확인된 상태:

- 관리자 로그인/로그아웃
- 관리자 대시보드 차트
- 고객 목록 검색, 마케팅 동의 필터, CSV export
- master data release 생성
- published release 기준 복제
- release validation
- publish / rollback
- audit log 조회
- 업종 추가 / 수정 / 비활성화
- published 기준 before/after diff 표시

현재 구현 수준은 “통계 보는 관리자”가 아니라, 운영자가 업종 카탈로그를 직접 관리하는 CMS v1에 가깝다.

### 6. DB source of truth 전환 작업이 코드에 반영돼 있다

대표 파일:

- `prisma/migrations/20260415_phase8_master_data_release/migration.sql`
- `scripts/import-master-data-from-json.ts`
- `scripts/validate-master-data-release.ts`
- `src/lib/master-data-validation.ts`

확인된 상태:

- `MasterDataRelease`, `StartupItemDraft`, `CareerSynergyDraft`, `AdminAuditLog` 등 모델 생성
- JSON baseline을 release로 import하는 스크립트 존재
- draft를 published snapshot으로 빌드하는 로직 존재
- 40개 고정 시나리오 기반 validation과 diversity 체크 존재

따라서 이 프로젝트는 더 이상 “엑셀 → JSON만 읽는 정적 서비스”가 아니라, DB release 발행 모델로 이동한 상태다.

### 7. 분석/이메일/수신거부/공유는 붙어 있지만 운영 연결은 일부 남아 있다

대표 파일:

- `src/lib/analytics.ts`
- `src/app/api/analytics/route.ts`
- `src/app/api/contact/route.ts`
- `src/app/api/unsubscribe/[token]/route.ts`
- `src/components/result/ShareButtons.tsx`
- `src/components/AdBanner.tsx`

확인된 상태:

- funnel event를 클라이언트와 서버 양쪽에 기록
- 결과 이메일 저장 API 존재
- 수신거부 토큰 기반 unsubscribe API 존재
- 결과 공유 버튼 존재
- 광고 영역 컴포넌트 존재

다만 현재 광고는 placeholder이고, 이메일도 운영 설정에 따라 “저장만 되고 발송은 안 되는” 상황이 가능하다.

## 아직 남아 있는 것

### 1. 운영 하드닝은 끝나지 않았다

기존 코드리뷰 기준으로 남아 있는 대표 이슈:

- 운영에서 DB/env 누락 시 fallback으로 조용히 내려갈 수 있음
- 관리자 세션 만료 검증과 재검증이 약함
- `ADMIN_SESSION_SECRET`, `ENCRYPTION_KEY`가 없어도 개발용 fallback으로 동작 가능
- 이메일 발송 실패가 사용자 성공 경험으로 보일 수 있음

즉, 기능 부족보다 운영 안전장치 부족이 더 큰 잔여 과제다.

### 2. 광고/이메일/배포는 “연결점”까지만 구현된 부분이 있다

- AdSense 실제 삽입 코드 대신 placeholder 노출
- Resend 발신자/운영 도메인 연결은 후속 작업 필요
- 운영 관리자 계정 bootstrap은 자동화가 약함
- build/test는 있어도 migration deploy와 env 강제 검증은 별도 정리 필요

### 3. 테스트는 핵심 로직 중심이고, 회귀 게이트는 더 단단해질 여지가 있다

현재 확인된 자동화:

- Vitest: `matching`, `master-data-validation`, `email-template`
- Playwright: UI flow 검증, diversity 검증, 결과/관리자 화면 캡처

한계:

- 단위 테스트 수는 아직 적은 편
- UI flow 스크립트는 과거 실패 기록이 있어 CI gate로는 추가 안정화가 필요
- 관리자 API 보안/권한 관련 회귀 테스트는 아직 약하다

## 현재 개발 단계 판정

현재 상태를 한 문장으로 정리하면 다음과 같다.

> “핵심 서비스와 운영용 CMS는 이미 구현됐고, 남은 일은 기능 개발보다 운영 품질 마감에 가깝다.”

좀 더 실무적으로 풀면:

- 사용자용 진단 서비스: 구현 완료
- 결과 설명 UX: 구현 완료
- 관리자 통계/고객 관리: 구현 완료
- master data release CMS: 구현 완료
- DB source of truth 전환: 구현 완료
- 운영 광고/메일/보안 하드닝: 부분 완료
- 배포 전 품질 게이트: 부분 완료

## 다음 우선순위 제안

1. 운영 env 강제와 fallback 정책 정리
2. 관리자 세션/권한 검증 강화
3. 이메일 성공/실패 응답 분리
4. `migrate deploy` 포함한 배포 절차 문서화
5. Playwright UI flow를 안정적인 배포 게이트로 정비

## 요약

이 프로젝트는 더 이상 “아이디어 검증용 초안”이 아니다.
현재 기준으로는 실제 진단 서비스, 결과 해설, 고객 수집, 관리자 운영, 마스터 데이터 release CMS까지 구현된 중후반 단계다.
다음 개발의 핵심은 새 기능 추가보다, 운영 원본 전환 구조를 안전하게 굳히고 배포 품질을 마감하는 일이다.
