# 2026-04-15 DB Source of Truth 전환 실행 플랜

- 작성일: 2026-04-15
- 범위: `엑셀 -> JSON -> 런타임` 구조를 `DB authoring -> published snapshot -> 런타임` 구조로 전환하는 구현 플랜
- 목표: 운영자가 관리자 페이지에서 데이터를 관리할 수 있게 하면서도, 추천 결과의 결정론성과 재현성을 유지

## 전제

현재 구조는 아래와 같다.

- 작성 원본: `startup_guide_v2.xlsx`
- 변환 스크립트: `scripts/seed-from-excel.ts`
- 런타임 데이터: `src/data/*.json`
- 추천 엔진: [src/lib/matching.ts](/Users/gangjingu/project/Quit-codex/src/lib/matching.ts)

이 플랜의 목표는 아래로 바꾸는 것이다.

- 작성 원본: DB
- 발행 단위: `published release`
- 백업/재현: immutable JSON snapshot
- 런타임 입력: published snapshot

## 성공 기준

이 플랜이 끝났다고 판단하는 기준은 아래다.

- 운영자가 관리자에서 업종을 추가/수정/비활성화할 수 있다
- draft 상태는 공개 사용자 결과에 반영되지 않는다
- publish 이후부터 새 결과에만 반영된다
- 과거 `UserResult`는 어떤 release/version으로 계산됐는지 추적 가능하다
- release rollback이 가능하다
- Excel을 수정하지 않아도 운영 데이터 변경이 가능하다

## 범위

### 포함

- 마스터 데이터 DB 스키마 추가
- 초기 JSON -> DB 마이그레이션
- published snapshot 구조 도입
- 런타임 로더 교체
- 관리자 CMS 초안
- publish/rollback/audit

### 제외

- 추천 알고리즘 공식 자체의 대규모 재설계
- 고객 CRM 전체 고도화
- 텔레그램 기반 운영툴
- 엑셀 양방향 동기화

## 결정사항 먼저 잠글 것

구현 시작 전에 아래 4가지는 확정하는 편이 맞다.

1. source of truth는 언제부터 DB로 전환할지
2. Excel은 archive로만 남길지, import 도구로 계속 둘지
3. v1에서 허용할 데이터 수정 범위
4. 공개 앱은 DB를 직접 읽을지, published snapshot만 읽을지

권장 답은 이렇다.

- source of truth 전환 시점은 “초기 import 완료 시점”
- Excel은 archive + 비상 import 도구
- v1 수정 범위는 `startup-items` 중심
- 공개 앱은 published snapshot만 읽기

## 구현 단계

## Phase 0. 기준선 고정

### 목적

현재 JSON을 “전환 직전 기준선”으로 확정한다.

### 작업

- 현재 `src/data/*.json` 상태를 기준 백업으로 별도 보관
- release version 명명 규칙 정의
  - 예: `v1-from-excel`
- 전환 이전 기준 문서 작성
  - 현재 카테고리 19개
  - startup items 129개
  - competency questions 24개
  - personality questions 10개

### 산출물

- `backups/master-data/v1-from-excel/*.json`
- 기준 release note 문서

### 완료 기준

- 현재 운영 기준 데이터가 무엇인지 명확히 재현 가능

## Phase 1. DB 스키마 추가

### 목적

작성용 DB 구조와 발행용 release 구조를 만든다.

### 신규 모델 권장안

- `MasterDataRelease`
- `StartupItemDraft`
- `CompetencyQuestionDraft`
- `HardFilterDraft`
- `PersonalityQuestionDraft`
- `CareerSynergyDraft`
- `CompetencyGuideDraft`
- `AdminAuditLog`

### `MasterDataRelease` 핵심 필드

- `id`
- `version`
- `status`
  - `draft`, `published`, `archived`
- `snapshotJson`
- `baseReleaseId`
- `createdBy`
- `createdAt`
- `publishedAt`
- `notes`

### `StartupItemDraft` 핵심 필드

- 현재 `StartupItem` 필드 전체
- `releaseId`
- `sourceItemId`
- `rowStatus`
  - `active`, `inactive`
- `sortOrder`

### 감사 로그 필드

- `adminUserId`
- `action`
- `targetType`
- `targetId`
- `beforeJson`
- `afterJson`
- `createdAt`

### 산출물

- Prisma schema 변경
- 마이그레이션 파일

### 완료 기준

- 빈 DB에서도 draft/published release를 만들 수 있는 상태

## Phase 2. JSON -> DB 초기 Import

### 목적

현재 운영 기준 JSON을 DB 초기 release로 올린다.

### 작업

- 별도 import 스크립트 작성
  - 예: `scripts/import-master-data-from-json.ts`
- `src/data/*.json`을 읽어서 DB draft release 생성
- draft를 바로 `published`로 승격
- `snapshotJson` 생성

### 권장 release 생성 순서

1. `MasterDataRelease(version='v1-from-excel', status='draft')`
2. 각 draft 테이블 bulk insert
3. denormalized snapshot 생성
4. `status='published'` 변경

### 산출물

- import 스크립트
- 첫 published release

### 완료 기준

- DB만으로 현재 JSON과 동일한 마스터 데이터를 복원 가능

## Phase 3. 런타임 로더 도입

### 목적

정적 import 대신 published snapshot 로더를 도입한다.

### 작업

- `src/lib/master-data.ts` 신규 추가
- `getPublishedMasterData()` 구현
- published release가 있으면 snapshot 사용
- 없으면 기존 `src/data/*.json` fallback 사용
- 메모리 캐시 또는 Next cache 사용

### 권장 반환 구조

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

### 변경 대상

- [src/lib/matching.ts](/Users/gangjingu/project/Quit-codex/src/lib/matching.ts)
- [src/app/diagnose/step-1/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-1/page.tsx)
- [src/app/diagnose/step-2/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-2/page.tsx)
- [src/app/diagnose/step-3/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-3/page.tsx)
- [src/components/result/SupplementGuide.tsx](/Users/gangjingu/project/Quit-codex/src/components/result/SupplementGuide.tsx)

### 완료 기준

- 앱이 published snapshot 기준으로 동일하게 동작
- DB release가 없으면 기존 JSON fallback으로 동작

## Phase 4. 결과 버전 기록

### 목적

사용자 결과가 어떤 데이터 버전으로 계산됐는지 추적 가능하게 만든다.

### 작업

- `UserResult`에 아래 필드 추가
  - `masterDataReleaseId`
  - `masterDataVersion`
  - `matchingEngineVersion`
- `POST /api/diagnose`에서 현재 published release 정보 저장
- 관리자에서 과거 결과 조회 시 version 표시

### 완료 기준

- 모든 신규 결과 row에 release/version 정보가 남음

## Phase 5. 관리자 CMS v1

### 목적

운영자가 업종 데이터를 draft 상태로 관리할 수 있게 한다.

### 범위

- 기존 카테고리 안에서 업종 추가
- 업종 수정
- 업종 비활성화
- draft 목록/상세/검색

### 비범위

- 새 카테고리 생성
- career 축 확장
- 알고리즘 가중치 수정 UI

### 관리자 화면 권장

- `/admin/catalog`
  - release 선택
  - 업종 목록
  - 카테고리 필터
  - active/inactive 상태
- `/admin/catalog/new`
  - 업종 생성
- `/admin/catalog/[id]`
  - 업종 수정
  - 변경 diff 미리보기

### 서버 API 권장

- `GET /api/admin/releases`
- `POST /api/admin/releases`
- `POST /api/admin/releases/:id/clone`
- `GET /api/admin/catalog`
- `POST /api/admin/catalog`
- `PATCH /api/admin/catalog/:id`

### 완료 기준

- 운영자가 코드 수정 없이 업종 draft를 만들고 수정 가능

## Phase 6. Publish/검증/Rollback

### 목적

draft를 안전하게 공개 반영하고, 문제 시 이전 버전으로 복구한다.

### Publish 흐름

1. draft 저장
2. validation 실행
3. 샘플 시나리오 결과 diff 생성
4. 다양성 검증 실행
5. snapshotJson 생성
6. release publish
7. 런타임 캐시 무효화

### 검증 항목

- 필수 필드 누락 여부
- 점수 범위 정합성
- 중복 업종명/ID 여부
- 투자비 min/max 정합성
- category 존재 여부
- 자격증 문자열 규칙
- hard filter 전량 탈락 여부
- 고정 시나리오 결과 급변 여부
- diversity 기준 유지 여부

### Rollback

- 이전 published release를 다시 current로 지정
- rollback 자체도 audit log 남김

### 완료 기준

- publish와 rollback이 관리자에서 수행 가능
- publish 전 자동 검증 실패 시 반영 차단

## Phase 7. Excel 퇴역

### 목적

운영 원본에서 Excel을 제거한다.

### 작업

- `AGENTS.md`와 관련 문서에서 source of truth를 DB로 변경
- `seed-from-excel.ts`는 archive/import 용도로만 격하
- 운영 절차에서 “엑셀 수정 후 seed” 제거
- 초기 JSON 백업과 release import 절차 문서화

### 완료 기준

- 운영팀이 더 이상 엑셀을 수정하지 않아도 됨

## 구현 순서 우선순위

현실적인 구현 순서는 아래가 좋다.

1. Phase 1 DB 스키마
2. Phase 2 초기 import
3. Phase 3 런타임 로더
4. Phase 4 결과 버전 기록
5. Phase 6 publish/rollback
6. Phase 5 관리자 CMS v1
7. Phase 7 Excel 퇴역

이 순서가 좋은 이유는 먼저 “DB로 읽을 수 있는 상태”를 만들고, 그다음 관리 화면을 붙이는 편이 안정적이기 때문이다.

## 리스크와 대응

### 리스크 1. 추천 결과가 기존과 달라질 수 있음

대응:

- `v1-from-excel` release를 초기 기준으로 생성
- 기존 JSON과 DB snapshot을 diff 비교
- 고정 시나리오 결과 비교 테스트 추가

### 리스크 2. draft가 실수로 공개 반영될 수 있음

대응:

- 런타임은 `published` 상태만 읽기
- `draft`와 `published`를 같은 테이블 상태값으로 구분

### 리스크 3. 과거 결과 설명이 어려워질 수 있음

대응:

- `UserResult`에 release/version 기록
- 과거 결과 row는 직접 수정 금지

### 리스크 4. 운영자가 잘못된 업종 데이터를 넣을 수 있음

대응:

- form validation
- publish 전 자동 검증
- audit log
- rollback

## 각 단계의 체크리스트

### Phase 1 완료 체크

- Prisma migration 생성됨
- 신규 테이블 생성 확인

### Phase 2 완료 체크

- JSON 기준 첫 release import 성공
- DB snapshot과 기존 JSON count 일치

### Phase 3 완료 체크

- diagnose/result flow 정상
- fallback 동작 유지

### Phase 4 완료 체크

- 신규 `UserResult`에 release/version 저장

### Phase 5 완료 체크

- 관리자에서 업종 draft 생성/수정 가능
- audit log 생성

### Phase 6 완료 체크

- publish 성공
- rollback 성공
- 검증 실패 시 publish 차단

### Phase 7 완료 체크

- 운영 문서에서 source of truth가 DB로 변경
- Excel은 archive/import 용도로만 남음

## 추가로 넣으면 좋은 것

- `release diff viewer`
  - 발행 전후 어떤 업종 값이 바뀌었는지 비교
- `sample scenario preview`
  - 대표 시나리오로 결과 비교
- `soft delete`
  - 업종 완전 삭제 대신 비활성화
- `import/export`
  - JSON import/export
- `release notes`
  - 발행 사유 기록
- `approval flow`
  - 작성자와 발행자 분리
- `customer impact preview`
  - 상위 추천 업종 변화량 시각화
- `alerting`
  - publish 실패 또는 diversity 하락 시 알림

## 한 줄 권고

이 전환은 “엑셀을 버리는 작업”이 아니라 “운영 원본을 DB로 승격하고, JSON은 발행 스냅샷으로 남기는 작업”으로 정의하는 편이 맞다.
