# 2026-04-15 DB 저장 항목 리서치

- 작성일: 2026-04-15
- 범위: 현재 Prisma/PostgreSQL 기준 저장 테이블, 실제 저장 필드, 저장 트리거, 민감정보 처리 방식
- 기준 코드: 워크트리 기준 현행 코드

## 결론

현재 DB에는 아래 4개 테이블이 정의돼 있다.

- `UserResult`: 진단 입력값과 추천 결과 저장
- `UserContact`: 이메일 저장 폼에서 받은 연락처 및 동의 정보 저장
- `AnalyticsEvent`: 화면 흐름 및 전환 이벤트 저장
- `AdminUser`: 관리자 로그인용 계정 저장

실제로 사용자 플로우에서 쓰기(write)가 발생하는 테이블은 현재 `UserResult`, `UserContact`, `AnalyticsEvent` 3개다.
`AdminUser`는 로그인 시 조회만 하며, 앱 내부에 관리자 계정을 생성하는 쓰기 경로는 아직 없다.

또한 DB 연결이 없을 때는 같은 구조가 `.local-data/storage.json` fallback으로 저장된다.
즉, “무엇을 저장하느냐”는 Prisma와 fallback이 거의 같고, 차이는 저장 위치가 DB냐 로컬 파일이냐에 있다.

## 확인 기준

- [prisma/schema.prisma](/Users/gangjingu/project/Quit-codex/prisma/schema.prisma)
- [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts)
- [src/app/api/diagnose/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/diagnose/route.ts)
- [src/app/api/contact/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/contact/route.ts)
- [src/app/api/analytics/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/analytics/route.ts)
- [src/types/index.ts](/Users/gangjingu/project/Quit-codex/src/types/index.ts)
- 로컬 Postgres `information_schema` 조회 결과

## 1. `UserResult`

### 역할

진단 완료 시점에 사용자 입력과 추천 결과 전체를 저장하는 메인 테이블이다.

### 저장 트리거

- `POST /api/diagnose`
- 내부 저장 함수: `saveResult()`

### 저장 필드

- `id`
  - 내부 결과 식별자
- `sessionId`
  - 결과 조회용 외부 세션 키
- `nickname`
  - 선택 입력 닉네임
- `createdAt`
  - 진단 결과 생성 시각
- `hardFilterInputs`
  - 현실 조건 8개를 JSON으로 저장
  - `capital`, `region`, `license`, `timing`, `family`, `income`, `career`, `loan`
- `competencyScores`
  - 12개 역량 점수 배열
- `personalityAnswers`
  - 10개 성향 답변 배열
- `top5Results`
  - 추천 결과 상위 5개 전체를 JSON으로 저장
  - 단순 업종명만 저장하는 것이 아니라, 각 결과의 점수와 설명까지 함께 저장
- `comicImageUrl`
  - 현재는 항상 `null`
- `userAgent`
  - 요청 브라우저 UA 문자열
- `ipHash`
  - 원본 IP가 아니라 해시값 저장

### `top5Results` 안에 들어가는 정보

`top5Results`는 `MatchResult[]` 구조이며, 각 추천 결과마다 아래 정보가 저장된다.

- `item`
  - 업종 원본 데이터 전체
  - 카테고리, 업종명, 투자비, 역량 요구치, 운영형태, 주말근무, 매출/수익성, 경쟁강도, 성장잠재력 등
- `finalScore`
  - 최종 추천 점수
- `breakdown`
  - `competencyFit`, `personalityFit`, `careerSynergy`, `marketAttractiveness`
- `riskWarnings`
  - 리스크 경고 문구 배열
- `competencyGap`
  - 부족 역량 목록
- `warningTags`
  - 주의 태그 배열
- `reason`
  - 왜 추천됐는지 설명 문구
- `marketSummary`
  - 시장성 요약
- `preparationGuide`
  - 준비 가이드

즉 결과 페이지를 다시 그리는 데 필요한 핵심 설명 데이터가 `UserResult` 하나에 거의 다 들어 있다.

## 2. `UserContact`

### 역할

결과 페이지에서 이메일 저장 폼을 제출했을 때, 연락처와 동의 이력을 저장한다.

### 저장 트리거

- `POST /api/contact`
- 내부 저장 함수: `saveContact()`
- 저장 방식: `userResultId` 기준 `upsert`

### 저장 필드

- `id`
  - 연락처 레코드 식별자
- `userResultId`
  - 연결된 `UserResult.id`
- `name`
  - 사용자 이름
- `email`
  - 이메일 주소
- `phoneEncrypted`
  - 전화번호 원문이 아니라 AES-256-GCM 암호문 저장
- `phoneHash`
  - 전화번호 중복 식별용 해시값
- `privacyConsent`
  - 개인정보 수집 동의 여부
- `privacyConsentAt`
  - 개인정보 수집 동의 시각
- `marketingConsent`
  - 마케팅 수신 동의 여부
- `marketingConsentAt`
  - 마케팅 동의 시각
- `consentIpHash`
  - 동의 요청의 원본 IP가 아니라 해시값 저장
- `consentUserAgent`
  - 동의 요청 브라우저 UA 문자열
- `unsubscribedAt`
  - 수신거부 처리 시각
- `unsubscribeToken`
  - 수신거부 링크 토큰
- `createdAt`
  - 생성 시각
- `updatedAt`
  - 마지막 수정 시각

### 저장 방식의 특징

- 한 `UserResult`에 대해 `UserContact`는 1개만 유지된다.
- 동일 세션에서 다시 제출하면 새 row를 추가하는 것이 아니라 기존 row를 갱신한다.
- `sessionId`는 DB 스키마 컬럼으로는 없고, 저장 직전 `UserResult`를 조회해 `userResultId`로 연결한다.

## 3. `AnalyticsEvent`

### 역할

사용자 행동 이벤트를 저장해 퍼널과 통계를 계산하는 테이블이다.

### 저장 트리거

- `POST /api/analytics`
- 내부 저장 함수: `recordAnalyticsEvent()`

### 저장 필드

- `id`
  - 이벤트 식별자
- `sessionId`
  - 결과 세션 또는 `anonymous`
- `eventType`
  - 이벤트 이름
- `metadata`
  - 추가 파라미터 JSON
- `createdAt`
  - 이벤트 시각

### 현재 저장 가능한 이벤트 이름

- `landing_view`
- `step1_start`
- `step1_complete`
- `step2_complete`
- `step3_complete`
- `ad_watched`
- `result_view`
- `share_click_kakao`
- `share_click_copy`
- `email_submit`

### 활용 방식

이 테이블은 관리자 통계에서 퍼널 집계에 직접 쓰인다.
즉, 결과 저장과 별개로 “사용자가 어디까지 왔는지”를 보는 운영 데이터다.

## 4. `AdminUser`

### 역할

관리자 로그인용 계정 정보를 저장하는 테이블이다.

### 저장 트리거

현재 앱 코드 안에는 `AdminUser`를 생성하거나 수정하는 API가 없다.
즉, 현재 애플리케이션에서 하는 일은 아래 한 가지뿐이다.

- 로그인 시 이메일 기준 조회

### 저장 필드

- `id`
- `email`
- `passwordHash`
- `createdAt`

### 중요한 해석

이 테이블은 “존재는 하지만, 앱이 스스로 채워 넣지는 않는 운영용 테이블”에 가깝다.
따라서 Prisma 모드에서는 DB에 `AdminUser` 레코드가 미리 없으면 운영 관리자 로그인은 되지 않는다.

## 관계 정리

- `UserResult` 1 : 0..1 `UserContact`
- `AnalyticsEvent`는 `sessionId`로 사용자 세션과 느슨하게 연결
- `AdminUser`는 다른 테이블과 관계 없음

## 민감정보 관점에서 실제 저장되는 것

### 저장되는 것

- 이름
- 이메일
- 전화번호 암호문
- 전화번호 해시
- 사용자 입력 진단값
- 추천 결과와 점수 분해 데이터
- 동의 이력
- 해시된 IP
- 브라우저 UA

### 원문 그대로 저장되지 않는 것

- 전화번호 원문
- IP 원문

전화번호는 `phoneEncrypted`와 `phoneHash`로 나뉘어 저장된다.
IP는 원문이 아니라 `ipHash`, `consentIpHash`로 저장된다.

## 저장되지 않는 것

현재 코드 기준으로 아래 항목은 DB에 직접 저장되지 않는다.

- 비밀번호 평문
- 전화번호 평문
- IP 평문
- 사용자의 전체 브라우저 세션/쿠키 값
- 광고 SDK 원본 로그
- 외부 메일 발송 결과 자체의 별도 DB 로그

## DB와 fallback의 차이

DB가 연결돼 있으면 위 구조가 PostgreSQL에 저장된다.
DB가 없으면 거의 같은 구조가 `.local-data/storage.json`에 저장된다.

다만 운영 관점에서는 둘의 의미가 다르다.

- PostgreSQL: 영속 저장소
- `.local-data/storage.json`: 로컬 개발용 fallback

즉, 현재 구조에서 “무엇을 저장하느냐”는 동일하지만 “어디에 안정적으로 남느냐”는 다르다.

## 현재 로컬 DB 상태

2026-04-15 확인 시점의 로컬 Postgres에는 아래 테이블이 존재했다.

- `UserResult`
- `UserContact`
- `AnalyticsEvent`
- `AdminUser`

확인 시점 row 수는 모두 `0`이었다.

- `UserResult`: 0
- `UserContact`: 0
- `AnalyticsEvent`: 0
- `AdminUser`: 0

## 한 줄 요약

현재 DB는 “진단 결과 본문”, “연락처 및 동의 이력”, “퍼널 이벤트”, “관리자 계정”을 저장한다.
그중 핵심은 `UserResult`와 `UserContact`이며, 추천 결과 설명 가능성을 유지하는 데 필요한 데이터가 `UserResult.top5Results`에 함께 보존된다.
