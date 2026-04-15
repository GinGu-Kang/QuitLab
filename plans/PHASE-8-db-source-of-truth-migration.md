# Phase 8: 마스터 데이터 DB 전환 + 관리자 CMS

> **사전 조건**: Phase 7 완료 (현재 서비스 배포/운영 가능 상태)
> **산출물**: DB source of truth, published snapshot, 관리자용 업종 CMS, publish/rollback
> **예상 파일 수**: ~18-25개

---

## 목표

현재 구조는 아래와 같다.

- 작성 원본: `startup_guide_v2.xlsx`
- 변환: `scripts/seed-from-excel.ts`
- 런타임 입력: `src/data/*.json`

Phase 8의 목표는 아래 구조로 전환하는 것이다.

- 작성 원본: DB
- 발행 단위: `published release`
- 백업/재현: immutable JSON snapshot
- 런타임 입력: published snapshot

이렇게 해야 운영자가 관리자 페이지에서 업종을 수정/추가할 수 있고, 과거 결과 재현성과 결정론성도 유지할 수 있다.

---

## 8-1. 전환 원칙 잠금

먼저 아래 원칙을 명확히 확정한다.

1. **DB가 source of truth다**
2. **Excel은 운영 원본이 아니라 archive/import 도구다**
3. **공개 앱은 draft가 아니라 published 데이터만 읽는다**
4. **과거 `UserResult`는 스냅샷으로 유지하고 직접 덮어쓰지 않는다**
5. **JSON은 수동 편집용이 아니라 release snapshot/backup으로 남긴다**

권장 release 명명 규칙:

- `v1-from-excel`
- `v2-catalog-adjustment`
- `v3-summer-release`

---

## 8-2. Prisma 스키마 확장

### 추가 모델

```prisma
model MasterDataRelease {
  id           String   @id @default(cuid())
  version      String   @unique
  status       String   // draft | published | archived
  snapshotJson Json?
  baseReleaseId String?
  notes        String?
  createdById  String?
  createdAt    DateTime @default(now())
  publishedAt  DateTime?
}

model StartupItemDraft {
  id                  String   @id @default(cuid())
  releaseId           String
  sourceItemId        Int?
  rowStatus           String   // active | inactive
  category            String
  name                String
  coreSkills          String
  investmentRange     String
  investmentMin       Int
  investmentMax       Int?
  competencyScores    Json
  operationType       String
  requiredStaff       String
  weekendWork         String
  workLifeBalance     Int
  seasonality         String
  requiredLicense     String
  avgMonthlyRevenue   String
  operatingMargin     String
  breakeven           String
  competitionLevel    Int
  differentiationRoom Int
  closureRate         String
  growthPotential     Int
  entryBarrier        Int
}

model CompetencyQuestionDraft {
  id              String   @id @default(cuid())
  releaseId       String
  sourceQuestionId Int?
  payload         Json
}

model HardFilterDraft {
  id              String   @id @default(cuid())
  releaseId       String
  sourceFilterId  String?
  payload         Json
}

model PersonalityQuestionDraft {
  id               String   @id @default(cuid())
  releaseId        String
  sourceQuestionId Int?
  payload          Json
}

model CareerSynergyDraft {
  id        String   @id @default(cuid())
  releaseId String
  careerKey String
  category  String
  score     Int
}

model CompetencyGuideDraft {
  id                String   @id @default(cuid())
  releaseId         String
  sourceGuideKey    String?
  payload           Json
}

model AdminAuditLog {
  id          String   @id @default(cuid())
  adminUserId String?
  action      String
  targetType  String
  targetId    String?
  beforeJson  Json?
  afterJson   Json?
  createdAt   DateTime @default(now())
}
```

### 추가 변경

`UserResult`에는 아래 필드를 추가한다.

```prisma
model UserResult {
  // 기존 필드 유지
  masterDataReleaseId String?
  masterDataVersion   String?
  matchingEngineVersion String?
}
```

---

## 8-3. 초기 데이터 Import

### 신규 스크립트

- `scripts/import-master-data-from-json.ts`

### 동작

1. 현재 `src/data/*.json` 로드
2. `MasterDataRelease(version='v1-from-excel', status='draft')` 생성
3. 각 draft 테이블에 bulk insert
4. denormalized snapshot 생성
5. release를 `published`로 승격

### 보조 백업

발행 시 아래 파일도 같이 생성한다.

- `backups/master-data/releases/v1-from-excel.json`

이 파일은 수동 diff와 비상 복구용이다.

---

## 8-4. 런타임 로더 도입

### 신규 파일

- `src/lib/master-data.ts`

### 역할

```ts
type PublishedMasterData = {
  releaseId: string;
  version: string;
  startupItems: StartupItem[];
  competencyQuestions: CompetencyQuestion[];
  hardFilters: HardFilter[];
  personalityQuestions: PersonalityQuestion[];
  careerSynergy: CareerSynergyMatrix;
  competencyGuide: CompetencyGuide[];
};
```

`getPublishedMasterData()`를 구현한다.

- published release가 있으면 snapshot 사용
- 없으면 기존 `src/data/*.json` fallback 사용
- 캐시를 둬서 diagnose 요청마다 DB를 과하게 조회하지 않게 한다

### 교체 대상

- [src/lib/matching.ts](/Users/gangjingu/project/Quit-codex/src/lib/matching.ts)
- [src/app/diagnose/step-1/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-1/page.tsx)
- [src/app/diagnose/step-2/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-2/page.tsx)
- [src/app/diagnose/step-3/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-3/page.tsx)
- [src/components/result/SupplementGuide.tsx](/Users/gangjingu/project/Quit-codex/src/components/result/SupplementGuide.tsx)

중요:

- `matching.ts`는 여전히 “JSON 객체”를 입력으로 받는 구조를 유지한다
- 추천 공식 자체는 이 Phase에서 바꾸지 않는다

---

## 8-5. 결과 버전 기록

`POST /api/diagnose` 저장 시 아래 정보를 같이 넣는다.

- `masterDataReleaseId`
- `masterDataVersion`
- `matchingEngineVersion`

이렇게 해야 나중에 관리자 화면에서 아래 질문에 답할 수 있다.

- 이 결과는 어떤 데이터 버전으로 계산됐나
- 왜 지금 재계산하면 다르게 나오나
- 어떤 release 이후부터 결과 분포가 바뀌었나

---

## 8-6. 관리자 CMS v1

### 범위

v1에서는 아래만 연다.

- 기존 카테고리 안에서 업종 추가
- 기존 업종 수정
- 업종 비활성화
- draft release 생성/복제

### 비범위

v1에서는 아래는 막는다.

- 새 카테고리 생성
- Step 1 career 축 확장
- 알고리즘 가중치 수정
- 과거 `UserResult` 직접 수정

### 관리자 화면

- `/admin/releases`
  - release 목록
  - current published 표시
  - draft 생성/복제
- `/admin/catalog`
  - 업종 목록
  - release 선택
  - 카테고리/상태 필터
- `/admin/catalog/new`
  - 업종 추가
- `/admin/catalog/[id]`
  - 업종 수정
  - before/after diff

### 관리자 API

- `GET /api/admin/releases`
- `POST /api/admin/releases`
- `POST /api/admin/releases/:id/clone`
- `GET /api/admin/catalog`
- `POST /api/admin/catalog`
- `PATCH /api/admin/catalog/:id`

### 검증

폼 저장 시 최소 아래는 검사한다.

- 필수 필드 누락 여부
- 점수 범위 1~5 여부
- 투자비 min/max 정합성
- category 존재 여부
- 중복 업종명/ID 여부

---

## 8-7. Publish / Rollback / Audit

### Publish 흐름

1. draft 저장
2. validation 실행
3. 샘플 시나리오 diff preview 생성
4. diversity 검증 실행
5. snapshotJson 생성
6. release를 `published`로 전환
7. 기존 published는 `archived`
8. 캐시 무효화

### Rollback

- 이전 archived/published release를 다시 current로 전환
- rollback도 audit log에 남긴다

### 감사 로그

반드시 남길 액션:

- release 생성/복제
- 업종 생성/수정/비활성화
- publish
- rollback
- CSV export
- 개인정보 평문 조회

---

## 8-8. 검증 자동화

Publish 전 검증은 아래를 자동화하는 편이 맞다.

- schema validation
- hard filter 전량 탈락 여부
- 샘플 시나리오 결과 diff
- `verify-diversity-playwright` 유사 기준
- top1 다양성 기준 유지 여부

권장 신규 스크립트:

- `scripts/validate-master-data-release.ts`
- `scripts/preview-release-diff.ts`

---

## 8-9. Excel 퇴역

전환 완료 후 운영 절차를 아래처럼 바꾼다.

### 기존

- 엑셀 수정
- `npm run seed`
- 배포

### 변경 후

- 관리자에서 draft 수정
- 검증
- publish

### Excel의 새 역할

- archive
- 비상 import 원본
- 초기 마이그레이션 참고자료

즉, 운영 원본에서는 제외한다.

---

## 단계별 체크리스트

### Step A. 기준선 고정

- 현재 JSON을 `v1-from-excel` 기준선으로 백업
- release 명명 규칙 확정

### Step B. DB 스키마

- Prisma schema 반영
- migration 성공

### Step C. 초기 import

- JSON -> DB import 성공
- 첫 published release 생성

### Step D. 런타임 로더

- diagnose flow 정상
- fallback 유지

### Step E. 결과 버전 기록

- 신규 `UserResult`에 release/version 저장

### Step F. 관리자 CMS v1

- 업종 draft 생성/수정/비활성화 가능

### Step G. publish/rollback

- publish 성공
- rollback 성공
- audit log 생성

### Step H. Excel 퇴역

- 운영 문서에서 source of truth를 DB로 변경

---

## 추가로 넣으면 좋은 것

- release diff viewer
- sample scenario preview
- soft delete
- JSON import/export
- publish 승인 플로우
- customer impact preview
- release notes
- alerting

---

## 완료 기준

이 Phase가 끝났다고 볼 수 있는 기준은 아래다.

- 운영자가 관리자 페이지에서 업종을 관리할 수 있다
- draft는 공개 반영되지 않는다
- publish 이후 새 결과에만 반영된다
- 과거 결과는 release/version 기준으로 재현 가능하다
- rollback 가능하다
- Excel을 운영 원본으로 더 이상 수정하지 않는다
