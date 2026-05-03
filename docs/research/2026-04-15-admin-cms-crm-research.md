# 2026-04-15 관리자 CMS/CRM 확장 설계 리서치

- 작성일: 2026-04-15
- 범위: 관리자 페이지에서 업종 추가/수정, 추천 결과값 운영, 고객 정보 조회를 지원하기 위한 설계 방향
- 기준 코드: 워크트리 기준 현행 코드

## 결론

원하는 기능은 가능하다.
다만 현재 구조에서는 관리자 페이지를 단순 CRUD 화면으로 붙이면 안 된다.

이유는 3가지다.

- 업종 데이터와 질문/시너지 데이터는 `startup_guide_v2.xlsx`가 원본이다.
- 추천 엔진은 `src/data/*.json`을 빌드 타임에 import해서 결정론적으로 계산한다.
- 사용자 결과는 `UserResult.top5Results`에 “당시 계산된 스냅샷”으로 저장된다.

따라서 추천 운영용 관리자 기능은 아래 3개로 분리해서 설계하는 편이 맞다.

- `고객 CRM`: 고객 정보 조회, 검색, 동의 이력, 결과 열람
- `업종 CMS`: 업종 아이템 추가/수정/비활성화, 초안/발행, 감사 로그
- `추천 운영`: 결과 미리보기, 가중치/룰 버전 관리, 발행 전 검증

가장 안전한 방향은 다음이다.

1. 먼저 고객 DB와 결과 조회 기능을 확장한다.
2. 그 다음 업종 데이터는 `Draft -> 검증 -> Publish` 흐름으로 붙인다.
3. 과거 결과는 직접 덮어쓰지 말고, “새 버전으로 재계산”하거나 운영 메모를 붙인다.

즉, 추천 서비스 운영툴은 “엑셀 원본을 무시하는 관리자”가 아니라 “엑셀 기반 추천 시스템 위에 올라가는 운영 레이어”로 설계해야 한다.

## 확인 기준

- [AGENTS.md](/Users/gangjingu/project/Quit-codex/AGENTS.md)
- [src/lib/matching.ts](/Users/gangjingu/project/Quit-codex/src/lib/matching.ts)
- [scripts/seed-from-excel.ts](/Users/gangjingu/project/Quit-codex/scripts/seed-from-excel.ts)
- [src/app/admin/layout.tsx](/Users/gangjingu/project/Quit-codex/src/app/admin/layout.tsx)
- [src/app/admin/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/admin/page.tsx)
- [src/app/admin/customers/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/admin/customers/page.tsx)
- [src/app/api/admin/stats/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/admin/stats/route.ts)
- [src/app/api/admin/export/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/admin/export/route.ts)
- [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts)
- [docs/research/2026-04-15-db-storage-items.md](/Users/gangjingu/project/Quit-codex/docs/research/2026-04-15-db-storage-items.md)
- [docs/research/2026-04-14_predeploy-code-review.md](/Users/gangjingu/project/Quit-codex/docs/research/2026-04-14_predeploy-code-review.md)

## 1. 현재 구조에서 바로 문제가 되는 제약

### 1-1. 업종 데이터는 DB가 아니라 엑셀 -> JSON 시딩 구조다

현재 공개 앱은 DB에서 업종 마스터를 읽지 않는다.
추천 엔진은 아래 데이터를 정적으로 import 한다.

- `startup-items.json`
- `career-synergy.json`
- `personality-questions.json`

즉, 관리자 화면에서 DB row를 수정해도 현재 `matchStartups()`는 그 값을 읽지 않는다.

### 1-2. 업종 추가는 단순히 row 하나 넣는 문제가 아니다

업종을 추가할 때 영향 범위는 최소 이 정도다.

- 업종 마스터 자체
- 카테고리 체계
- 경력 시너지 매트릭스
- 성향 진단 favorable tag/alias 매칭
- 설명 문구 생성 로직

현재 카테고리는 19개로 고정돼 있고, 경력 시너지 매트릭스와 동일한 축을 공유한다.
따라서 “기존 카테고리에 업종 추가”와 “새 카테고리 생성”은 난도가 전혀 다르다.

### 1-3. 과거 결과는 이미 스냅샷으로 저장된다

`UserResult.top5Results`에는 단순 업종 ID만 저장되는 것이 아니라 당시의 추천 결과, 점수 분해, 설명 문구가 통째로 들어간다.
따라서 업종 마스터를 나중에 바꿔도 과거 row의 결과는 자동으로 바뀌지 않는다.

이건 오히려 장점이다.
과거 결과 재현성과 설명 가능성이 유지되기 때문이다.

반대로 말하면, 관리자 페이지에서 과거 결과를 직접 수정하는 기능은 신중해야 한다.

### 1-4. 현재 관리자 페이지는 읽기 전용에 가깝다

현재 제공되는 관리자 기능은 아래 2개뿐이다.

- 대시보드 통계
- 고객 목록 조회/검색/CSV 다운로드

즉, 운영툴의 기반은 있지만 CMS는 아직 없다.

## 2. 요구사항을 세 가지 제품으로 나눠서 봐야 한다

### 2-1. 고객 CRM

사용자 요청 중 “고객 정보 확인”은 현재 구조와 가장 잘 맞는다.
이미 `UserContact`, `UserResult`, `AnalyticsEvent`가 있어서 확장 비용이 가장 낮다.

여기서 필요한 것은 “데이터 모델 추가”보다 “조회 UX와 보안 통제”다.

### 2-2. 업종 CMS

“직종/업종 추가”는 사실상 운영용 마스터 데이터 편집기다.
이 영역은 단순 관리 페이지가 아니라 추천 시스템의 입력 원본을 다루는 CMS다.

이 경우 중요한 질문은 이 두 가지다.

- 공개 앱이 읽는 원본은 계속 엑셀/시딩 JSON으로 둘 것인가
- 아니면 DB의 발행된 버전을 실시간으로 읽게 바꿀 것인가

### 2-3. 추천 운영

“결과값 수정”은 의미가 3가지로 갈라진다.

- 업종 마스터 값 수정
- 알고리즘 가중치/패널티/태그 로직 수정
- 이미 저장된 사용자 결과 row 수정

이 세 가지는 같은 화면에 넣으면 안 된다.
권한도 달라야 하고, 검증 방식도 달라야 한다.

## 3. 추천하는 관리자 정보구조

관리자 IA는 아래처럼 분리하는 편이 맞다.

- `/admin`
  - 대시보드
- `/admin/customers`
  - 고객 목록, 검색, 세그먼트, CSV
- `/admin/customers/[id]`
  - 고객 상세, 결과 이력, 동의 상태, 운영 메모
- `/admin/results`
  - 저장된 결과 조회, 샘플 입력 재실행, 버전 비교
- `/admin/catalog`
  - 업종 목록, 상태, 카테고리 필터, draft/published 구분
- `/admin/catalog/new`
  - 업종 추가
- `/admin/catalog/[id]`
  - 업종 수정, 검증 결과, 변경 이력
- `/admin/matching`
  - 가중치/룰/태그/시너지 설정
- `/admin/changes`
  - 발행 이력, diff, 롤백, 감사 로그

이렇게 분리하면 “고객 관리”, “데이터 운영”, “알고리즘 운영”이 섞이지 않는다.

## 4. 어떤 방식을 권장하나

### 권장안: DB Draft + Published Override + Excel 동기화

현재 프로젝트 제약을 가장 덜 깨는 구조는 이 방식이다.

#### Layer 1. 기준 원본

- `startup_guide_v2.xlsx`
- `npm run seed`로 생성된 `src/data/*.json`

이건 계속 baseline으로 유지한다.

#### Layer 2. 관리자 초안

관리자 페이지에서 업종 추가/수정은 DB의 draft 테이블에 저장한다.
이 초안은 공개 앱에 바로 반영되지 않는다.

#### Layer 3. 발행본

승인된 draft를 “published release”로 고정한다.
공개 앱은 기본 JSON 위에 published override만 머지해서 읽는다.

이렇게 하면 좋은 점이 있다.

- 엑셀 원본을 당장 버리지 않아도 된다
- 운영자가 실시간 수정/발행을 할 수 있다
- 어떤 버전으로 추천이 계산됐는지 추적할 수 있다
- 나중에 엑셀로 역동기화할 여지도 남긴다

### 비권장안 1: 관리자 페이지가 `src/data/*.json`을 직접 수정

이 방식은 금지에 가깝다.

- JSON이 빌드 산출물이라는 원칙과 충돌한다
- Git/배포 파이프라인과 뒤엉킨다
- 감사 로그와 diff 관리가 어렵다

### 비권장안 2: 과거 `UserResult.top5Results`를 직접 덮어쓰기

이 방식도 피하는 편이 맞다.

- 사용자가 본 결과와 DB의 결과가 달라질 수 있다
- 추천 재현성이 깨진다
- 설명 가능성 감사가 어려워진다

## 5. 데이터 모델은 이렇게 나누는 편이 맞다

아래는 실제 구현 시 추천하는 신규 모델들이다.

### 5-1. 권한/감사

- `AdminUser`
  - 기존 유지
- `AdminRole` 또는 `AdminUser.role`
  - `owner`, `ops`, `marketing`, `analyst`
- `AdminAuditLog`
  - 누가, 언제, 무엇을, 어떻게 바꿨는지

`AdminAuditLog`는 필수다.
업종 값, 알고리즘 값, 고객 전화번호 조회, CSV export, publish, rollback 모두 남겨야 한다.

### 5-2. 업종 CMS

- `CatalogRelease`
  - draft/published/archived 상태
  - 기준 seed 버전, 발행 시각, 작성자
- `CatalogStartupItem`
  - 업종 데이터 전체
  - 기존 `StartupItem` 필드와 거의 1:1
  - `releaseId`, `sourceItemId`, `status`

핵심은 “patch”만 저장할지 “완성된 row”를 저장할지인데, 운영 UI를 생각하면 complete row 저장이 더 낫다.
폼 구현, validation, diff, preview가 모두 쉬워진다.

### 5-3. 알고리즘 설정

- `MatchingConfigRelease`
  - 가중치, penalty, alias, 태그 룰 버전
- `CareerSynergyOverride`
  - 경력 x 카테고리 시너지 수정값

초기에는 이 영역을 read-only로 두고, v2에서 열어도 된다.
여긴 잘못 건드리면 전체 추천이 흔들린다.

### 5-4. 고객/운영 메모

- `CustomerNote`
  - 상담 메모, 태그, 담당자
- `ResultReissue`
  - 운영자가 특정 입력으로 새 버전 결과를 재계산한 기록

이건 고객 응대용으로 매우 유용하다.

## 6. “직종 추가”는 어디까지 허용할지 미리 정해야 한다

### 6-1. v1에서는 “기존 카테고리에 업종 추가”만 허용하는 편이 맞다

예를 들어 `F&B` 카테고리 안에 새 업종 하나를 추가하는 것은 비교적 안전하다.
필요한 값은 현재 `StartupItem` 스키마 필드들로 대부분 충족된다.

### 6-2. “새 카테고리 생성”은 v1에서 막는 편이 맞다

새 카테고리를 허용하면 아래를 같이 만져야 한다.

- 경력 시너지 14 x 카테고리 매트릭스
- 성향 진단 favorable tag
- 카테고리 alias
- 일부 태그 매칭 규칙
- 결과 설명 로직

즉, 새 카테고리는 사실상 업종 추가가 아니라 “추천 체계 확장”에 가깝다.
이건 별도 승인 플로우가 필요하다.

### 6-3. “직종 추가”가 사용자 Step 1의 이전 경력 14개를 뜻한다면 더 어렵다

현재 `career` 옵션은 14개로 고정이고, 시너지 매트릭스도 이 축을 전제로 한다.
따라서 이전 경력 직군 자체를 추가하는 기능은 v1 범위를 넘긴다.

이 경우 필요한 건 단순 옵션 추가가 아니라 다음 전체다.

- Step 1 옵션 확장
- 타입 확장
- 시너지 매트릭스 새 row
- 엑셀 원본 구조 변경

따라서 v1 범위에서는 “창업 업종 아이템 추가”만 허용하고, “경력 직군 추가”는 보류하는 편이 맞다.

## 7. “결과값 수정”은 이렇게 나눠야 한다

### 7-1. 업종 현실 데이터 수정

예:

- 투자비
- 평균 월매출
- 경쟁강도
- 성장잠재력
- 진입장벽
- 필요 인력
- 자격증

이건 `CatalogStartupItem` 수정으로 처리하면 된다.
미래 추천 결과에 영향을 주는 입력값 수정이다.

### 7-2. 알고리즘 값 수정

예:

- competency/personality/career/market 비중
- 지역/가족/희망수입 penalty
- category alias 매칭
- personality tag 판단 룰

이건 별도 `MatchingConfigRelease`로 분리하는 편이 맞다.
업종 마스터 수정과 같은 화면에서 다루면 사고 난다.

### 7-3. 과거 사용자 결과 수정

이건 원칙적으로 “직접 수정 금지”가 맞다.

대신 아래 두 가지를 제공하는 편이 낫다.

- `재계산 미리보기`
  - 저장된 입력을 현재 발행 버전으로 다시 돌려 보기
- `재발행`
  - 기존 결과를 덮어쓰지 않고 새 운영 결과 버전을 만들기

이렇게 해야 과거 스냅샷과 운영 보정 결과를 구분할 수 있다.

## 8. 고객 정보 화면은 이렇게 확장하는 게 좋다

현재 고객 목록은 이름, 이메일, 동의 여부, 가입일 정도만 보여준다.
운영에 쓰려면 최소 이 정도까지 확장하는 편이 좋다.

- 검색
  - 이름, 이메일, 전화 해시
- 필터
  - 마케팅 동의
  - 수신거부 여부
  - 가입일 범위
  - 상위 추천 업종
  - 최근 결과 생성일
- 상세 화면
  - 이름, 이메일, 마케팅 동의, 수신거부 시각
  - 전화번호 마스킹 표시
  - 필요 시 “보기” 버튼으로 복호화
  - 상위 추천 업종 5개
  - 당시 입력값 요약
  - 운영 메모

전화번호는 기본적으로 마스킹된 상태만 보여주고, 평문 복호화는 높은 권한에서만 허용하는 편이 맞다.
복호화 이벤트도 감사 로그에 남겨야 한다.

## 9. 추천 운영툴에서 꼭 필요한 발행 절차

업종이나 결과 운영값을 바꾸는 순간, 이 프로젝트에서는 “발행 전 검증”이 핵심이다.

권장 흐름은 아래와 같다.

1. 운영자가 draft를 수정한다.
2. 시스템이 Zod/도메인 validation을 통과시킨다.
3. 샘플 시나리오로 diff preview를 만든다.
4. 고정 검증 시나리오 40개에 대해 결과 변화를 비교한다.
5. `verify-diversity-playwright`와 유사한 다양성 기준을 돌린다.
6. 통과하면 publish 한다.
7. publish 후 캐시를 invalidate 한다.
8. 새 결과부터 해당 버전을 사용한다.

이때 publish 검증에 들어가야 할 핵심 체크는 이 정도다.

- 역량 점수 범위 1~5
- 투자비 min/max 정합성
- 필수 자격증 문자열 규칙
- 카테고리 존재 여부
- 중복 업종명/ID 여부
- hard filter에서 과도한 전량 탈락이 생기지 않는지
- 고정 시나리오 top1 다양성 기준 유지

## 10. 사용자 결과 재현성을 위해 추가해야 하는 필드

현재 구조에서 운영툴을 제대로 만들려면 `UserResult`에 아래 정보도 남기는 편이 좋다.

- `catalogReleaseId`
- `matchingConfigReleaseId`
- `resultEngineVersion`

이렇게 해야 “이 결과가 어떤 데이터/룰 버전으로 계산됐는지”를 나중에 추적할 수 있다.
관리자 화면에서 과거 결과를 설명할 때도 필요하다.

## 11. 보안과 권한은 먼저 보강하는 편이 맞다

운영툴 확장 전에 최소한 아래는 먼저 정리하는 편이 좋다.

- 관리자 세션 만료 검사
- 보호 라우트에서 관리자 실존 여부 재검증
- 역할 기반 권한 분리
- 고객 개인정보 조회 감사 로그
- CSV export 감사 로그
- publish/rollback 감사 로그

현재 보안 이슈는 [2026-04-14_predeploy-code-review.md](/Users/gangjingu/project/Quit-codex/docs/research/2026-04-14_predeploy-code-review.md)에 이미 정리돼 있다.
관리자 기능을 늘릴수록 이 항목의 우선순위가 더 올라간다.

## 12. 구현 순서는 이렇게 가는 편이 현실적이다

### Phase A. 관리자 보안/운영 기반

- 세션 검증 강화
- `AdminUser.role` 추가
- `AdminAuditLog` 추가

### Phase B. 고객 CRM 확장

- 고객 상세 페이지
- 결과 요약/세그먼트
- 운영 메모
- 전화번호 마스킹/복호화 권한

### Phase C. 결과 조회/재실행 도구

- 저장된 `UserResult` 조회
- 같은 입력으로 재계산 preview
- 버전 diff 확인

### Phase D. 업종 Draft CMS

- 업종 추가/수정/비활성화
- 기존 카테고리 기준만 허용
- draft 저장
- 발행 전 검증

### Phase E. Published Override 런타임 반영

- 공개 추천 API가 JSON baseline + published override를 머지해서 읽도록 변경
- `UserResult`에 release version 기록

### Phase F. 알고리즘 설정 편집

- 가중치/penalty/UI 템플릿 수정
- 시나리오 검증 후 publish

이 순서가 좋은 이유는 “고객 DB는 빨리 열고”, “추천 로직 편집은 가장 늦게 여는” 구조이기 때문이다.

## 13. 추가적으로 넣으면 좋은 것들

아래 항목들은 운영 효율이 높아서 하단 우선순위 후보로 추천할 만하다.

- `고객 메모/태그`
  - 예: 고관심, 재연락 필요, 상담완료
- `결과 재발송`
  - 특정 고객에게 결과 이메일 다시 보내기
- `상위 추천 업종 기준 세그먼트`
  - 예: F&B 추천군만 보기
- `수신거부/마케팅 동의 변화 로그`
  - 동의 철회 시점 추적
- `샘플 시나리오 저장소`
  - 운영자가 자주 보는 대표 입력 케이스 저장
- `발행 diff 리포트`
  - publish 전후 어떤 업종이 얼마나 오르내렸는지
- `다양성/건전성 자동 점검`
  - publish 버튼 전에 자동 검사
- `롤백`
  - 이전 발행본으로 즉시 복귀
- `CSV 말고 XLSX 내보내기`
  - 실무에서 엑셀 공유가 더 편한 경우 많음
- `권한별 메뉴 숨김`
  - 마케팅 담당자는 고객/내보내기만, 운영자는 catalog까지
- `전화번호 보기 2단계 확인`
  - 실수 방지
- `고객별 최근 활동 타임라인`
  - 랜딩, 결과 조회, 이메일 제출, 수신거부 등
- `운영 공지 메모`
  - 이번 발행에서 무엇을 왜 바꿨는지 기록
- `엑셀 동기화 상태 표시`
  - 현재 published override가 엑셀 원본에 반영됐는지 여부

## 14. 한 줄 권고

이 프로젝트의 관리자 페이지는 단순 CRUD가 아니라 “고객 CRM + 업종 CMS + 추천 운영” 3개를 나눠 설계해야 한다.
가장 중요한 원칙은 `과거 결과는 스냅샷으로 보존하고`, `미래 결과에만 versioned publish를 반영하며`, `엑셀 원본과의 연결 고리`를 끊지 않는 것이다.
