# 2026-04-15 엑셀 원본 탈피 및 DB 중심 운영 전환 리서치

- 작성일: 2026-04-15
- 범위: 현재 엑셀 -> JSON 시딩 구조를 DB 중심 운영 구조로 바꾸는 방안
- 기준 코드: 워크트리 기준 현행 코드

## 결론

네. 현재는 아직 “엑셀이 작성 원본”인 구조가 맞다.
정확히 말하면 런타임이 매 요청마다 엑셀을 읽는 것은 아니고, 엑셀에서 생성된 JSON을 읽는다.

현재 흐름은 이렇다.

- 작성 원본: `startup_guide_v2.xlsx`
- 시딩: `scripts/seed-from-excel.ts`
- 런타임 사용 데이터: `src/data/*.json`

즉, 운영 관점에서는 이미 “엑셀 직접 사용”이 아니라 “엑셀에서 만든 정적 JSON 번들 사용”에 가깝다.
문제는 여전히 데이터 관리의 출발점이 엑셀이라는 점이다.

질문한 방향대로 더 효율적으로 가려면 다음이 가장 좋다.

- `DB를 source of truth로 전환`
- `JSON은 immutable snapshot/backup으로 보관`
- `공개 앱은 published snapshot만 읽게 구성`

이 방식이 좋은 이유는 이렇다.

- 관리자 페이지에서 바로 운영 가능
- 수정/검수/발행/롤백이 쉬움
- 과거 버전 재현 가능
- 추천 결과에 어떤 데이터 버전이 쓰였는지 추적 가능
- 빌드 없이 데이터 운영 가능

한 줄로 정리하면:

`엑셀 -> JSON -> 앱` 구조를 `DB authoring -> published JSON snapshot -> 앱` 구조로 바꾸는 게 가장 현실적이다.

## 현재 상태 정리

### 지금 실제로 앱이 읽는 데이터

현재 앱은 아래 JSON을 직접 import해서 쓴다.

- `startup-items.json` 129개
- `competency-questions.json` 24개
- `hard-filters.json` 8개
- `personality-questions.json` 10개
- `career-synergy.json` 14개 직군 축
- `competency-guide.json` 12개

### 현재 코드에서 JSON을 읽는 위치

- 추천 엔진: [src/lib/matching.ts](/Users/gangjingu/project/Quit-codex/src/lib/matching.ts)
- Step 1: [src/app/diagnose/step-1/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-1/page.tsx)
- Step 2: [src/app/diagnose/step-2/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-2/page.tsx)
- Step 3: [src/app/diagnose/step-3/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/diagnose/step-3/page.tsx)
- 결과 가이드: [src/components/result/SupplementGuide.tsx](/Users/gangjingu/project/Quit-codex/src/components/result/SupplementGuide.tsx)

### 현재 구조의 문제

- 데이터 수정하려면 엑셀을 고치고 다시 시딩해야 한다
- 운영자가 관리자 페이지에서 수정할 수 없다
- 발행 승인 흐름이 없다
- 버전 diff와 롤백이 어렵다
- 업종 추가/비활성화 같은 운영성 변경이 번거롭다

## 권장 아키텍처

### 핵심 원칙

아래 두 층을 분리하는 편이 맞다.

- `작성용 데이터 모델`
- `배포/런타임용 스냅샷 모델`

이걸 섞으면 안 된다.

### 권장안: DB 원본 + JSON 스냅샷

#### Layer 1. Authoring DB

운영자가 관리자에서 수정하는 원본은 DB에 둔다.
이게 진짜 source of truth가 된다.

#### Layer 2. Published Snapshot

발행 시점마다 전체 마스터 데이터를 한 번의 JSON snapshot으로 만든다.
이 스냅샷은 immutable하게 보관한다.

#### Layer 3. Runtime Read Model

공개 앱은 “가장 최근 published snapshot”만 읽는다.
운영자가 draft를 수정 중이어도 공개 사용자 결과에는 영향이 없다.

이 구조가 좋은 이유는 런타임과 운영 UX 요구가 다르기 때문이다.

- 운영 UI는 row 단위 편집과 검색이 중요
- 추천 엔진은 denormalized JSON을 빠르게 읽는 게 중요

즉, `작성은 DB`, `실행은 snapshot JSON`이 가장 안정적이다.

## 왜 “DB만 실시간 조회”보다 이 구조가 낫나

DB를 원본으로만 두고 공개 앱이 매 요청마다 여러 테이블을 join해서 읽게 만들 수도 있다.
하지만 이 프로젝트는 추천 계산에서 아래 데이터가 함께 필요하다.

- 업종 마스터
- 경력 시너지
- 성향 질문 및 favorable tags
- hard filter 옵션
- 역량 가이드

이걸 실시간 조인 기반으로 읽게 만들면 다음 문제가 생긴다.

- 추천 로딩 경로가 느려질 수 있다
- 발행 중간 상태가 사용자에게 노출될 수 있다
- 같은 날에도 시점별로 결과가 흔들릴 수 있다
- 운영자가 일부만 저장한 상태가 공개 반영될 수 있다

반대로 snapshot 구조는 장점이 명확하다.

- 읽기 빠름
- 결과 재현 쉬움
- 발행 단위 rollback 쉬움
- 추천 엔진 코드 변경 최소화 가능

## 추천 데이터 모델

### 1. Release

`MasterDataRelease`

- `id`
- `version`
- `status`
  - `draft`, `published`, `archived`
- `sourceType`
  - `excel-import`, `admin-created`, `admin-edited`
- `baseReleaseId`
- `snapshotJson`
  - 발행 시점 전체 데이터 JSON
- `notes`
- `createdBy`
- `createdAt`
- `publishedAt`

이 테이블이 핵심이다.
한 번 publish된 release는 변경하지 않고, 다음 draft를 새로 만든다.

### 2. 업종 마스터

`StartupItemDraft`

- 기존 `StartupItem` 필드를 거의 그대로 가짐
- `releaseId`
- `sourceItemId`
- `status`
  - `active`, `inactive`, `deleted`

여기에는 현재 `src/data/startup-items.json`의 129개 row 구조를 거의 그대로 넣으면 된다.

### 3. 질문/가이드/시너지

정규화는 과하게 하지 않는 편이 낫다.
운영 난이도와 구현 비용을 줄이려면 아래 정도가 적당하다.

- `CompetencyQuestionDraft`
- `HardFilterDraft`
- `PersonalityQuestionDraft`
- `CareerSynergyDraft`
- `CompetencyGuideDraft`

### 4. 감사 로그

`AdminAuditLog`

- `id`
- `adminUserId`
- `action`
  - `create_draft`, `update_item`, `publish_release`, `rollback_release`, `view_phone`, `export_csv`
- `targetType`
- `targetId`
- `beforeJson`
- `afterJson`
- `createdAt`

이건 필수다.
특히 추천 데이터와 개인정보를 같이 다루는 관리자 시스템이면 꼭 필요하다.

## JSON 백업은 어떻게 두는 게 좋나

질문한 방향대로 JSON 백업은 두는 게 맞다.
다만 “수동 편집용 JSON”이 아니라 “발행 스냅샷 JSON”으로 두는 편이 맞다.

권장 방식은 두 가지다.

### 방식 A. DB 안에 JSON snapshot 저장

`MasterDataRelease.snapshotJson` 컬럼에 전체 스냅샷을 저장한다.

장점:

- 버전 추적 쉬움
- 롤백 쉬움
- DB 하나로 관리 가능

단점:

- 사람이 파일로 보기엔 불편

### 방식 B. DB + 파일 백업 동시 유지

발행 시 아래처럼 파일도 같이 남긴다.

- `backups/master-data/releases/<release-version>.json`

장점:

- Git diff나 수동 점검에 유리
- 비상 복구가 쉬움

단점:

- 저장 위치가 2개라 관리 정책이 필요

실무적으로는 둘 다 두는 편이 좋다.

- DB: 운영 원본 + snapshot 기록
- 파일: 백업/감사/수동 diff 확인

## 공개 앱은 어떻게 읽게 바꾸는 게 좋나

### 현재

- 정적 import
- 빌드 타임 번들 포함

### 전환 후 권장

`src/lib/master-data.ts` 같은 로더를 둔다.

역할은 이렇다.

- 현재 published release 조회
- 없으면 기본 JSON fallback 사용
- 조회 결과를 메모리 캐시
- 필요 시 `revalidateTag` 또는 캐시 무효화

즉, 추천 엔진은 여전히 “JSON 객체”를 받게 하고, 데이터 가져오는 방식만 바꾸는 편이 맞다.

이렇게 하면 `matching.ts`를 전부 갈아엎지 않아도 된다.

### 권장 런타임 형태

- `getPublishedMasterData()`
  - `startupItems`
  - `competencyQuestions`
  - `hardFilters`
  - `personalityQuestions`
  - `careerSynergy`
  - `competencyGuide`
  - `releaseId`
  - `version`

그리고 `POST /api/diagnose`에서 이 `releaseId/version`을 결과 row에 함께 저장한다.

## 결과 재현성 때문에 꼭 추가해야 하는 것

DB 기반으로 바꾸면 `UserResult`에 아래 필드를 추가하는 편이 맞다.

- `masterDataReleaseId`
- `masterDataVersion`
- `matchingEngineVersion`

이유는 간단하다.

- 어떤 데이터 버전으로 결과가 나왔는지 남겨야 한다
- 나중에 같은 입력으로 재실행해도 차이를 설명할 수 있어야 한다
- 운영자가 “왜 예전엔 A였는데 지금은 B냐”를 설명할 수 있어야 한다

## 엑셀은 어떻게 정리하는 게 좋나

### 권장

- 현재 엑셀을 1회 최종 import 원본으로 사용
- 그 결과를 DB에 올린 뒤 운영 원본 역할은 종료
- 엑셀 파일은 `archive` 성격으로만 보관

### 비권장

- 엑셀과 DB를 동시에 source of truth로 유지

이건 거의 반드시 꼬인다.

- 운영자가 DB에서 수정
- 누군가는 엑셀 수정
- 어느 쪽이 최신인지 불명확
- 나중에 시딩하면 운영 변경이 날아감

즉, 전환을 하려면 어느 시점부터는 명확히 선언해야 한다.

- “이 날짜 이후 마스터 데이터 원본은 DB다”

## 추천 마이그레이션 순서

### Phase 1. Excel 종료 준비

- 현재 `src/data/*.json`을 기준 snapshot으로 확정
- 이 JSON을 백업 디렉터리에 별도 보관
- 엑셀 수정 금지 선언

### Phase 2. DB 스키마 추가

- `MasterDataRelease`
- 각 draft 테이블
- `AdminAuditLog`

### Phase 3. 초기 데이터 이관

- 현재 `src/data/*.json`을 읽어서 DB draft/published로 import
- 첫 release 생성
- `version = v1-from-excel`

### Phase 4. 런타임 로더 도입

- 정적 import 대신 `getPublishedMasterData()` 사용
- published release가 있으면 DB snapshot 사용
- 없으면 기존 `src/data/*.json` fallback

### Phase 5. 관리자 CMS

- 업종 목록
- 업종 추가/수정
- 비활성화
- 질문/시너지 수정
- draft 저장

### Phase 6. 검증 + Publish

- Zod validation
- 고정 시나리오 diff preview
- diversity check
- publish
- snapshot 생성

### Phase 7. Excel 완전 은퇴

- `seed-from-excel.ts`는 archive/import 용으로만 유지
- 운영 문서에서 source of truth를 DB로 변경

## 어떤 부분부터 DB화하는 게 좋나

한 번에 다 바꾸지 말고 우선순위를 이렇게 두는 편이 맞다.

### 우선 1. `startup-items`

이게 운영 변화에 가장 민감하고, 업종 추가/수정 요구도 여기서 나온다.

### 우선 2. `career-synergy`

카테고리 변화나 추천 품질과 직접 연결된다.

### 우선 3. `personality-questions`

태그 매칭 구조가 추천 결과에 직접 영향을 준다.

### 우선 4. `hard-filters`, `competency-guide`, `competency-questions`

이건 비교적 덜 자주 바뀌므로 나중에 옮겨도 된다.

## 추천 운영 방식

운영 플로우는 아래처럼 가는 게 좋다.

1. 운영자가 draft를 만든다
2. 업종 추가/수정/비활성화를 한다
3. 샘플 입력으로 결과 미리보기를 본다
4. 자동 검증을 돌린다
5. publish 한다
6. snapshot JSON을 생성한다
7. 새 진단부터 새 release를 사용한다

이렇게 해야 “수정은 자유롭게, 공개 반영은 통제되게” 만들 수 있다.

## 비권장 구조

아래는 피하는 게 좋다.

- DB row를 수정하면 바로 공개 추천에 반영되는 구조
- 관리자 페이지가 `src/data/*.json` 파일을 직접 수정하는 구조
- publish/version 없이 live edit만 존재하는 구조
- 과거 결과 row를 직접 덮어쓰는 구조
- Excel과 DB를 동시에 운영 원본으로 두는 구조

## 현실적인 권고

질문한 방향대로라면 가장 현실적인 선택은 이것이다.

- `엑셀은 이제 운영 원본에서 제외`
- `현재 JSON을 기준 백업본으로 확정`
- `DB를 작성 원본으로 승격`
- `published release JSON snapshot을 별도 보관`
- `공개 앱은 published snapshot만 읽도록 변경`

이게 가장 효율적이고, 관리자 페이지 만들기도 편하고, 나중에 롤백/감사도 쉽다.

## 추가적으로 같이 넣으면 좋은 것

- `release diff viewer`
  - 발행 전후 어떤 업종 값이 바뀌었는지 표시
- `sample scenario preview`
  - 대표 사용자 케이스로 결과 차이 비교
- `publish check`
  - 다양성, 전량탈락 여부, 필수 필드 누락 검사
- `rollback`
  - 이전 release 즉시 복귀
- `soft delete`
  - 업종 삭제 대신 비활성화
- `import/export`
  - JSON import/export 지원
- `masking + audit`
  - 고객 개인정보 조회 이력 기록
- `release note`
  - 이번 발행에서 무엇을 왜 바꿨는지 기록

## 한 줄 권고

엑셀을 계속 원본으로 두는 구조는 운영툴 확장과 충돌한다.
이 프로젝트는 `DB authoring + immutable JSON snapshot + versioned publish` 구조로 옮기는 게 가장 효율적이다.
