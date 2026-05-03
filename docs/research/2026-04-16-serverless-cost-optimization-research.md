# 2026-04-16 서버리스 전환 비용 최적화 리서치

- 작성일: 2026-04-16
- 범위: 현재 `Quit-codex` 구조에서 서버리스 전환이 실제로 비용 효율적인지, 그리고 어떤 구조 변경이 있어야 비용 최적화가 되는지 검토
- 기준: 현재 워크트리 기준 코드와 2026-04-16 시점 공식 가격/배포 문서

## 결론

서버리스로 "옮기기만" 해서는 이 프로젝트의 비용이 자동으로 내려가지 않는다.
현재 구조에서 진짜 비용을 좌우하는 것은 앱 서버보다 DB와 쓰기 패턴이다.

핵심 결론은 아래와 같다.

1. 현재 구조 그대로 `Vercel + Supabase`로 가는 것은 서버리스이긴 하지만, 비용 최적화 관점에서는 강하지 않다.
2. 서버리스가 비용 효율적이려면 `dedicated Postgres`보다 `scale-to-zero` 또는 usage-based DB로 바꾸고, 서버 측 analytics 쓰기를 줄여야 한다.
3. 운영 리스크까지 감안한 현실적인 서버리스 안은 `Vercel Pro + Neon`이다.
4. 순수 비용만 보면 더 공격적인 안은 `Cloudflare Workers + Neon`이지만, 현재 코드 기준 마이그레이션 난이도와 운영 리스크가 더 높다.
5. 코드 변경 비용과 운영 단순성까지 포함한 총비용을 보면, `단일 VPS 1대` 유지가 가장 강한 저비용 기준선이다.

즉, 이 프로젝트에서 비용 최적화의 본질은 "서버리스 여부"가 아니라 아래 두 가지다.

- 고정비가 있는 인프라를 usage-based로 바꾸는 것
- DB에 남기는 쓰기 횟수와 무거운 집계를 줄이는 것

## 현재 구조에서 서버리스 비용에 영향을 주는 요소

현재 런타임 구조는 `Next.js 14 + Prisma + PostgreSQL + Resend`가 핵심이다.

- 의존성 기준: [package.json](/Users/gangjingu/project/Quit-codex/package.json:24)
- DB provider 기준: [prisma/schema.prisma](/Users/gangjingu/project/Quit-codex/prisma/schema.prisma:5)
- 메일 발송 기준: [src/app/api/contact/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/contact/route.ts:41)

비용과 서버리스 적합성에 직접 영향을 주는 현재 코드 특징은 아래와 같다.

### 1. 프로덕션 fallback이 로컬 파일 쓰기다

- `.local-data/storage.json`에 결과, 연락처, 이벤트를 저장하는 fallback이 있다.
- 코드 근거: [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:20), [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:95)
- 관리자 release backup도 런타임 파일시스템에 best-effort로 쓴다.
- 코드 근거: [src/lib/master-data-admin.ts](/Users/gangjingu/project/Quit-codex/src/lib/master-data-admin.ts:101)

이 구조는 로컬 개발에는 유용하지만, 서버리스 프로덕션에서는 영속 저장소로 볼 수 없다.
따라서 서버리스로 가려면 먼저 production에서 파일 fallback을 막아야 한다.

### 2. Prisma 연결 방식이 전형적인 서버리스 연결 관리 문제를 가진다

- 현재 `PrismaClient`를 직접 생성해서 재사용한다.
- 코드 근거: [src/lib/prisma.ts](/Users/gangjingu/project/Quit-codex/src/lib/prisma.ts:8)

이 방식은 서버 한 대에서는 단순하고 잘 동작한다.
하지만 함수형 서버리스에서는 호출마다 연결이 늘어날 수 있으므로 pooled connection 또는 serverless DB가 사실상 필수다.

### 3. 사용자 1회 진단당 DB 쓰기 횟수가 생각보다 많다

기본 사용자 플로우 기준으로 서버 측 쓰기 작업은 대략 아래처럼 발생한다.

1. `/api/diagnose` 결과 저장 1회
2. `/api/contact` 저장 0~1회
3. `/api/analytics` 이벤트 저장 7~10회

분석 이벤트는 클라이언트에서 별도 API를 계속 호출한다.

- 이벤트 API 호출 코드: [src/lib/analytics.ts](/Users/gangjingu/project/Quit-codex/src/lib/analytics.ts:17)
- 이벤트 DB 저장 코드: [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:322)

즉, 이 앱은 계산량이 큰 앱이라기보다 "작은 쓰기가 자주 나는 앱"에 가깝다.
이 패턴에서는 compute 비용보다 DB 요청 수와 연결 관리가 더 중요하다.

### 4. 관리자 통계 API는 전체 데이터를 메모리로 끌어온다

- 관리자 통계는 `userResult`, `userContact`, `analyticsEvent` 전체를 읽고 서버 메모리에서 가공한다.
- 코드 근거: [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:374)

트래픽이 커지면 이 부분은 서버리스 함수 실행 시간과 DB 읽기 비용을 같이 늘린다.
서버리스 전환 후에도 그대로 두면 비용 효율이 떨어진다.

### 5. 결과 페이지는 같은 결과를 두 번 읽는다

- `generateMetadata()`가 `getResultBySession()`을 한 번 읽고,
- 페이지 본문도 `getResultBySession()`을 다시 읽는다.
- 코드 근거: [src/app/result/[sessionId]/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/result/[sessionId]/page.tsx:8), [src/app/result/[sessionId]/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/result/[sessionId]/page.tsx:27)

트래픽이 아주 큰 서비스는 아니지만, 서버리스 환경에서는 이런 중복 read도 누적 비용으로 이어진다.

## 서버리스로 바꿨을 때 비용이 내려가는 조건

이 프로젝트가 서버리스에서 비용 효율적이 되려면 아래 조건이 동시에 맞아야 한다.

1. 앱 compute는 호출형 과금으로 보내고, 유휴 시간에는 비용이 거의 0에 가깝게 내려가야 한다.
2. DB도 scale-to-zero 또는 usage-based여야 한다.
3. analytics 같은 고빈도 이벤트를 운영 DB에 직접 적재하지 않거나, 최소한 배치/집계형으로 바꿔야 한다.
4. 관리자 통계처럼 전체 스캔하는 API는 집계 테이블 또는 SQL group-by 기반으로 바꿔야 한다.
5. 프로덕션 파일시스템 write를 제거해야 한다.

이 중 1번만 만족하고 2~5번을 그대로 두면 "서버리스"이긴 하지만 비용 최적화와는 거리가 멀다.

## 공급자별 비교

## 1. Vercel + Supabase

이 조합은 현재 코드와 가장 자연스럽게 맞는다.
하지만 비용 최적화 관점의 장점은 제한적이다.

### 장점

- Next.js App Router와 배포 경험이 가장 자연스럽다.
- Prisma + Postgres 경로를 거의 유지할 수 있다.
- 마이그레이션 난이도가 가장 낮다.

### 단점

- Vercel Hobby는 공식적으로 non-commercial personal use only다.
- 공식 근거: Vercel Hobby 문서는 Hobby를 free tier로 설명하면서 "non-commercial, personal use only"라고 명시한다.
- Vercel source: https://vercel.com/docs/plans/hobby

- Vercel Pro 업그레이드는 사용자당 `$20 / month`다.
- 공식 근거: Vercel Hobby 문서의 업그레이드 설명
- Vercel source: https://vercel.com/docs/plans/hobby

- Supabase는 프로젝트마다 dedicated server를 제공한다.
- 공식 근거: Supabase Billing FAQ는 "We provide a dedicated server for every Supabase project"라고 설명한다.
- Supabase source: https://supabase.com/docs/guides/platform/billing-faq

- Supabase Pro는 `$25 Pro Plan`이고, 기본 compute size 기준 1개 프로젝트를 compute credit으로 커버하는 구조다.
- 공식 근거: Supabase Billing FAQ의 pricing example
- Supabase source: https://supabase.com/docs/guides/platform/billing-faq

### 비용 해석

실질적으로 1인 운영 기준의 하한은 대략 아래처럼 해석하는 편이 맞다.

- Vercel Pro: `$20+/mo`
- Supabase Pro: `$25/mo`
- Resend Free 또는 Pro: `$0~20/mo`

즉, `Vercel Pro + Supabase Pro`는 메일 제외 최소 바닥이 사실상 `약 $45/mo`다.
서버리스라는 점을 제외하면, 순수 비용 최적화 관점에서는 강하지 않다.

### 판단

`Vercel + Supabase`는 "가장 쉬운 서버리스"이지 "가장 싼 서버리스"는 아니다.

## 2. Vercel + Neon

현재 코드 기준으로 가장 현실적인 서버리스 비용 최적화 안은 이 조합이다.

### 장점

- 앱은 Vercel에 그대로 올리기 쉽다.
- DB는 usage-based + scale-to-zero 성향을 가진 Neon으로 바꿀 수 있다.
- Prisma도 공식적으로 Vercel 배포와 connection pooling, preview DB 분리를 안내한다.
- Prisma source: https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel

### 공식 가격/제약 포인트

- Vercel Pro는 credit-based usage billing이며, Pro 업그레이드는 사용자당 `$20 / month`
- source: https://vercel.com/docs/plans/hobby
- Neon Launch는 usage-based이며 pricing page 기준 typical spend는 `$15/mo`
- source: https://neon.com/pricing
- Neon paid plan은 no monthly minimum이며, idle month는 bill이 "just a few dollars"가 될 수 있다고 설명한다.
- source: https://neon.com/pricing
- Neon은 idle 시 compute가 scale down to zero 된다.
- source: https://neon.com/pricing
- Neon은 pooled connections를 제공한다.
- source: https://neon.com/pricing

### 비용 해석

이 조합의 월 비용 하한은 대략 아래처럼 본다.

- Vercel Pro: `$20/mo`
- Neon: 사용량에 따라 `수 달러 ~ $15+`
- Resend: `$0~20`

즉, `저트래픽 + bursty` 트래픽이면 `약 $20대 중후반 ~ $30대 초반`으로 떨어질 가능성이 있다.
이는 `Vercel + Supabase`보다 분명히 낫다.

### 판단

서버리스로 가되, 마이그레이션 리스크를 통제하고 싶다면 가장 균형이 좋다.

## 3. Cloudflare Workers + Neon

순수 서버리스 비용 효율만 보면 가장 공격적인 선택지다.

### 장점

- Cloudflare Workers Paid는 account minimum이 `$5/month`
- 공식 근거: Workers pricing page
- source: https://developers.cloudflare.com/workers/platform/pricing/

- Workers Paid는 월 1천만 requests 포함이고, Pages Functions도 Workers로 과금된다.
- source: https://developers.cloudflare.com/workers/platform/pricing/

- Next.js는 Cloudflare Workers에 OpenNext adapter로 배포할 수 있다.
- 공식 guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

- Cloudflare changelog는 2025-04-08 기준 Next.js 지원이 `@opennextjs/cloudflare`를 통한 `v1.0-beta`라고 설명했다.
- source: https://developers.cloudflare.com/changelog/post/2025-04-08-fullstack-on-workers/

- Neon은 usage-based + scale-to-zero라서 Workers와 조합 시 고정비를 낮추기 좋다.
- source: https://neon.com/pricing

### 단점

- 현재 프로젝트는 Next.js를 그냥 Node 서버로 돌리는 가정이 강하다.
- Cloudflare로 가면 `OpenNext adapter`, `wrangler`, `nodejs_compat`, preview/deploy script 조정이 필요하다.
- 공식 guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

- Prisma는 Cloudflare Workers에서 edge-compatible driver 또는 Prisma Postgres를 써야 한다.
- 공식 guide: https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare

- 현재 코드의 파일 fallback과 Node 중심 Prisma 초기화는 그대로 가져가기 어렵다.

### 비용 해석

저트래픽 기준 예상 바닥은 아래처럼 볼 수 있다.

- Workers Paid: `$5/mo`
- Neon: `수 달러 ~ $15+`
- Resend: `$0~20`

이론적으로는 가장 싸다.
하지만 현재 코드 기준으로는 마이그레이션 비용과 운영 복잡도가 가장 크다.

### 판단

서버리스 비용 최적화만 보면 가장 강하다.
다만 "이번 분기 안에 안전하게 옮길 수 있냐"를 기준으로 보면 리스크가 더 높다.

## 어떤 구조가 가장 비용 효율적인가

현재 코드 기준으로 결론을 분리하면 아래와 같다.

### 총전환비용까지 포함하면

- `단일 VPS 1대` 유지는 가장 강한 저비용 기준선이다.
- 이유는 DB와 앱을 같이 올릴 수 있고, 현재 구조를 거의 안 바꿔도 되기 때문이다.

### 순수 월 청구서만 보면

- `저트래픽 + 유휴 시간이 긴 조건`에서는 `Cloudflare Workers + Neon`이 더 낮게 나올 가능성도 있다.
- 다만 이 경우는 코드 변경량과 운영 리스크를 별도로 감수해야 한다.

### 서버리스를 반드시 써야 한다면

- `Cloudflare Workers + Neon`이 가장 낮은 런닝코스트를 만들 가능성이 높다.
- 단, 현재 코드에서 바꿔야 할 것이 제일 많다.

### 서버리스 + 현실적 리스크 균형을 보면

- `Vercel Pro + Neon`이 가장 현실적인 선택이다.
- 현재 코드 수정량이 상대적으로 적고, `Vercel + Supabase`보다 고정비가 낮다.

## 비용 최적화를 위해 반드시 바꿔야 하는 코드/구조

이 섹션은 "서버리스 여부와 무관하게" 비용 최적화에 직접 연결되는 변경이다.

## 1. production 파일 fallback 제거

현재 구조에서는 DB가 없을 때 `.local-data/storage.json`에 쓰는 fallback이 존재한다.
서버리스에서는 이 fallback이 비용 최적화가 아니라 장애 원인이 된다.

권장 변경:

1. `NODE_ENV === 'production'`에서 `DATABASE_URL`이 없으면 즉시 실패
2. `.local-data` write는 로컬 개발에서만 허용
3. `writeReleaseBackup()` 같은 런타임 파일 backup은 object storage 또는 DB audit로 대체

## 2. analytics를 운영 DB에서 분리

현재는 `landing_view`, `step1_start`, `step1_complete`, `step2_complete`, `step3_complete`, `ad_watched`, `result_view`, `email_submit`, 공유 클릭 등이 모두 `/api/analytics`를 거쳐 DB에 저장된다.

- 클라이언트 호출: [src/lib/analytics.ts](/Users/gangjingu/project/Quit-codex/src/lib/analytics.ts:17)
- 서버 저장: [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:322)

권장 변경:

1. 퍼널 분석은 GA4 또는 Cloudflare Analytics로 우선 이전
2. 운영 DB에는 꼭 필요한 이벤트만 저장
3. 관리자 퍼널이 꼭 DB 기반이어야 한다면 일배치 집계 테이블만 유지

예상 효과:

- 사용자 1명당 7~10회 수준의 write 감소
- DB 사용량, 함수 호출 수, 관리자 통계 비용 동시 절감

## 3. 관리자 통계 API를 집계형으로 변경

현재 `getAdminStats()`는 전체 row를 `findMany()`로 읽고 서버에서 reduce 한다.

- 코드 근거: [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:374)

권장 변경:

1. 일별 참여 수는 DB group-by 또는 pre-aggregated table로 계산
2. top item 집계도 SQL 또는 별도 summary table로 계산
3. funnel은 raw events 전체 스캔 대신 event_type/day 집계 테이블 사용

예상 효과:

- 서버리스 함수 duration 감소
- cold start 이후 첫 admin 페이지 진입 비용 감소
- 데이터가 늘어날수록 비용 차이가 커짐

## 4. 결과 페이지 중복 조회 줄이기

현재 결과 페이지는 metadata 생성과 본문 렌더링에서 같은 결과를 두 번 읽는다.

- 코드 근거: [src/app/result/[sessionId]/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/result/[sessionId]/page.tsx:8), [src/app/result/[sessionId]/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/result/[sessionId]/page.tsx:27)

권장 변경:

1. metadata에 필요한 최소 필드를 결과 저장 시 별도 캐시 키로 분리
2. 또는 결과 페이지 자체를 캐시 가능한 형태로 재구성

이건 1~3번보다 우선순위는 낮지만, 서버리스 read 비용 최적화에는 의미가 있다.

## 5. published snapshot을 CDN 친화적으로 배포

마스터 데이터는 release publish 이후 자주 바뀌지 않는다.
현재는 DB snapshot을 읽고 메모리 캐시를 두는 구조인데, 서버리스에서는 인스턴스 메모리 캐시 효율이 낮다.

권장 변경:

1. publish 시 immutable JSON snapshot 생성
2. 이를 Blob/KV/R2 같은 cheap storage에 저장
3. 런타임은 versioned snapshot을 CDN 캐시로 읽기

예상 효과:

- 결과 페이지와 추천 엔진의 reference data read를 DB에서 분리
- DB를 "결과/연락처/관리" 중심으로 축소 가능

## 서버리스 구조별 실행 플랜

## 안 A. 리스크 낮은 서버리스 전환

구조:

- Frontend/API: Vercel Pro
- DB: Neon Launch
- Email: Resend
- Analytics: GA4 우선, 운영 DB 이벤트 최소화

실행 순서:

1. production fallback 제거
2. analytics DB write 제거 또는 최소화
3. Prisma pooled connection URL로 변경
4. `postinstall: prisma generate` 추가
5. `vercel-build: prisma generate && prisma migrate deploy && next build` 추가
6. preview DB 분리

이 안이 맞는 경우:

- 운영 안정성을 우선
- 배포 경험을 단순하게 유지
- 비용도 현재보다 낮추고 싶음

## 안 B. 순수 비용 최적화형 서버리스 전환

구조:

- Frontend/API: Cloudflare Workers
- DB: Neon
- Email: Resend
- Static/master snapshot: R2 또는 KV

실행 순서:

1. 안 A의 1~3번 선행
2. `@opennextjs/cloudflare`, `wrangler` 도입
3. `nodejs_compat` 설정
4. Prisma를 edge-compatible driver 또는 Prisma Postgres 경로로 전환
5. `preview`, `deploy` 스크립트 재구성
6. Worker runtime 기준 integration test 추가

이 안이 맞는 경우:

- 운영팀이 infra migration을 감당 가능
- 최저 월비용이 가장 중요
- Vercel 종속을 줄이고 싶음

## 최종 권장안

현재 프로젝트에는 아래 순서를 권장한다.

1. 당장 비용 최적화만 원하면 서버리스보다 먼저 `analytics DB write 제거`, `admin 통계 집계화`, `production fallback 제거`를 한다.
2. 그 다음 서버리스로 간다면 `Vercel Pro + Neon`을 1차 목표로 잡는다.
3. 실제 월 트래픽과 비용 추이를 1~2개월 측정한 뒤, 더 줄일 필요가 있으면 `Cloudflare Workers + Neon`으로 2차 전환을 검토한다.

이 순서가 맞는 이유는 단순하다.

- 지금 비용의 핵심은 서버 compute보다 DB와 write 패턴이다.
- `Vercel + Supabase`는 서버리스이지만 DB가 dedicated라 비용 최적화 폭이 작다.
- `Cloudflare + Neon`은 싸지만 이 프로젝트 기준 migration complexity가 높다.
- 따라서 먼저 데이터 흐름을 가볍게 만든 뒤, 리스크가 낮은 서버리스부터 적용하는 편이 전체 비용 대비 효과가 좋다.

## 참고 소스

- Vercel Plans: https://vercel.com/docs/plans
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Prisma Deploy to Vercel: https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel
- Supabase Billing FAQ: https://supabase.com/docs/guides/platform/billing-faq
- Neon Pricing: https://neon.com/pricing
- Cloudflare Workers Pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Next.js on Workers Guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Cloudflare Full-stack on Workers Changelog: https://developers.cloudflare.com/changelog/post/2025-04-08-fullstack-on-workers/
- Prisma Deploy to Cloudflare Workers & Pages: https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare
- Resend Pricing: https://resend.com/pricing
- Resend Quotas and Limits: https://resend.com/docs/knowledge-base/account-quotas-and-limits
