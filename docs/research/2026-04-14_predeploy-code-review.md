# 2026-04-14 배포 전 코드리뷰 리서치

- 작성일: 2026-04-14
- 범위: 배포 전 보안, 저장소, 이메일 발송, 운영 설정, 회귀 검증
- 기준 브랜치 상태: 워크트리 기준 현행 코드

## 결론

현재 코드는 `npm test`, `npm run lint`, `npm run build`, 추천 다양성 검증까지는 통과한다.
하지만 운영 배포 기준으로는 아래 P1 항목을 먼저 정리하는 편이 맞다.

- `DATABASE_URL` 누락 시 운영에서도 로컬 JSON fallback으로 조용히 내려가는 구조
- 관리자 세션이 서버 측에서 만료되지 않고, 보호 라우트가 현재 관리자 계정 존재 여부를 다시 확인하지 않는 구조
- `ADMIN_SESSION_SECRET`, `ENCRYPTION_KEY`가 없어도 운영에서 machine-local fallback으로 계속 동작하는 구조
- 이메일 발송이 실제로 실패하거나 비활성화돼도 사용자에게 성공으로 보이는 구조
- 운영 관리자 계정이 DB에 미리 생성되지 않으면 `/admin` 로그인이 불가능한 구조

즉, 앱은 “실행은 되지만”, 배포 후 데이터 유실·운영 오작동·보안 약화가 조용히 발생할 수 있는 상태다.

## 실행한 검증

- `npm test`: 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- `node scripts/verify-diversity-playwright.cjs`: 통과
  - 결과: `distinct_top1=19`
- `node scripts/verify-ui-flow-playwright.cjs`: 실패
  - 실패 지점: `scripts/verify-ui-flow-playwright.cjs:21`
  - 증상: 랜딩 첫 CTA `내 운명 가게 찾기` 대기에서 `Timeout 30000ms exceeded`
  - 참고: 실제 랜딩 버튼 텍스트는 [src/app/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/page.tsx:52) 기준 동일하므로, 앱 자체 문제인지 스크립트/브라우저 자동화 문제인지 추가 분리가 필요하다.

## P1. 배포 전 수정 권장 항목

### 1. 운영에서 DB 미설정 시 로컬 파일 저장소로 조용히 fallback 된다

- 코드 근거:
  - [src/lib/prisma.ts](/Users/gangjingu/project/Quit-codex/src/lib/prisma.ts:8)
  - [src/lib/prisma.ts](/Users/gangjingu/project/Quit-codex/src/lib/prisma.ts:17)
  - [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:22)
  - [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:33)
- 현상:
  - `DATABASE_URL`만 없으면 Prisma를 아예 쓰지 않고 `.local-data/storage.json`에 결과/연락처/이벤트를 저장한다.
- 왜 위험한가:
  - 서버리스나 다중 인스턴스 환경에서는 이 파일이 영속 저장소가 아니다.
  - 결과적으로 결과 페이지, 연락처 수집, 관리자 통계가 배포 환경에서 조용히 유실되거나 인스턴스별로 갈라질 수 있다.
- 권장 수정:
  - `NODE_ENV === 'production'`에서 `DATABASE_URL`이 없으면 부팅 실패 또는 첫 요청에서 명시적 500을 반환하도록 바꾼다.
  - JSON fallback은 로컬 개발 전용으로 제한한다.

### 2. 관리자 세션이 서버에서 만료되지 않고, 보호 라우트가 현재 관리자 계정을 재검증하지 않는다

- 코드 근거:
  - [src/lib/auth.ts](/Users/gangjingu/project/Quit-codex/src/lib/auth.ts:48)
  - [src/lib/auth.ts](/Users/gangjingu/project/Quit-codex/src/lib/auth.ts:59)
  - [src/app/admin/layout.tsx](/Users/gangjingu/project/Quit-codex/src/app/admin/layout.tsx:8)
  - [src/app/api/admin/stats/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/admin/stats/route.ts:7)
  - [src/app/api/admin/export/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/admin/export/route.ts:7)
- 현상:
  - 토큰에는 `issuedAt`가 들어가지만 검증 시 만료 여부를 확인하지 않는다.
  - 보호 라우트는 “서명이 맞는 토큰인지”만 보고 통과시키며, 토큰 속 이메일이 현재 실제 관리자 계정인지 다시 확인하지 않는다.
- 왜 위험한가:
  - 한 번 발급된 쿠키를 탈취하거나 수동으로 재주입하면 브라우저 쿠키 만료 이후에도 서버는 계속 유효하다고 본다.
  - 관리자 계정을 삭제하거나 비밀번호를 바꿔도 기존 세션 무효화가 되지 않는다.
- 권장 수정:
  - `verifyAdminSessionToken()`에서 `issuedAt + maxAge` 검사를 추가한다.
  - 보호 라우트에서 토큰 이메일로 `getAdminUser()`를 다시 조회해 현재 유효한 관리자만 통과시키게 한다.
  - 가능하면 서명 쿠키만 쓰지 말고 서버 저장 세션 또는 회전 가능한 세션 버전 값을 둔다.

### 3. 관리자/개인정보 보안 키가 없어도 운영에서 fallback으로 계속 동작한다

- 코드 근거:
  - [src/lib/auth.ts](/Users/gangjingu/project/Quit-codex/src/lib/auth.ts:8)
  - [src/lib/auth.ts](/Users/gangjingu/project/Quit-codex/src/lib/auth.ts:24)
  - [src/lib/crypto.ts](/Users/gangjingu/project/Quit-codex/src/lib/crypto.ts:7)
  - [src/lib/crypto.ts](/Users/gangjingu/project/Quit-codex/src/lib/crypto.ts:25)
- 현상:
  - `ADMIN_SESSION_SECRET`, `ENCRYPTION_KEY`가 비어 있어도 머신 fingerprint 기반 해시로 대체한다.
- 왜 위험한가:
  - 배포 설정이 비어 있어도 서비스가 “겉으로는 정상 동작”해서 운영 사고를 늦게 발견한다.
  - 인스턴스가 바뀌면 암복호화와 세션 검증 동작이 달라질 수 있다.
  - 키 관리 실수가 장애로 빨리 드러나지 않고, 나중에 로그인 실패나 복호화 불가로 터질 수 있다.
- 권장 수정:
  - production에서는 두 환경변수를 필수로 강제한다.
  - fallback은 `NODE_ENV !== 'production'`에서만 허용한다.
  - 배포 체크 시 env 검증 스크립트를 추가한다.

### 4. 이메일 발송이 실제로 안 돼도 사용자에게는 성공으로 보일 수 있다

- 코드 근거:
  - [src/lib/resend.ts](/Users/gangjingu/project/Quit-codex/src/lib/resend.ts:3)
  - [src/app/api/contact/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/contact/route.ts:41)
  - [src/app/api/contact/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/contact/route.ts:45)
  - [src/components/result/EmailCollector.tsx](/Users/gangjingu/project/Quit-codex/src/components/result/EmailCollector.tsx:39)
- 현상:
  - `RESEND_API_KEY`가 없으면 `resend`가 `null`이 되고, API는 발송을 건너뛴 채 성공을 반환한다.
  - 발송 실패가 나도 서버는 로그만 남기고 성공을 반환한다.
  - 발신자 주소가 `onboarding@resend.dev`로 고정돼 있어 운영용 검증 도메인 설정이 아직 코드에 반영되지 않았다.
- 왜 위험한가:
  - 사용자는 “결과를 이메일로 보내드렸어요!” 토스트를 보지만 실제로는 메일을 받지 못할 수 있다.
  - 운영에서 메일 기능이 꺼져 있어도 QA에서 놓치기 쉽다.
- 권장 수정:
  - production에서 `RESEND_API_KEY` 또는 발신자 도메인이 없으면 `/api/contact`가 명시적으로 실패하도록 바꾼다.
  - 응답을 `saved: true`, `emailed: true|false`처럼 분리해서 프론트가 정확한 토스트를 보여주게 한다.
  - `from` 주소를 실제 검증된 도메인 기반 환경변수로 분리한다.

### 5. 운영 관리자 계정은 env만 넣어서는 생성되지 않는다

- 코드 근거:
  - [src/lib/repository.ts](/Users/gangjingu/project/Quit-codex/src/lib/repository.ts:267)
  - [src/app/api/admin/auth/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/admin/auth/route.ts:22)
  - [prisma/schema.prisma](/Users/gangjingu/project/Quit-codex/prisma/schema.prisma:61)
- 현상:
  - Prisma가 활성화된 운영 모드에서는 관리자 로그인 시 `AdminUser` 테이블만 조회한다.
  - `.env.example`의 `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`는 JSON fallback 저장소 초기화에만 쓰이며, Prisma 모드에서는 사용되지 않는다.
  - 로컬 개발용 `admin@local.dev / admin1234!` 우회는 `localhost`에서만 허용된다.
- 왜 위험한가:
  - Vercel + Supabase로 정상 배포해도, `AdminUser` 레코드를 미리 넣지 않으면 운영 관리자 로그인은 무조건 401이 된다.
- 권장 수정:
  - 배포 절차에 “운영 관리자 계정 1개를 DB에 직접 생성” 단계를 포함한다.
  - 장기적으로는 `prisma seed` 또는 별도 bootstrap 스크립트로 관리자 계정 생성 절차를 자동화한다.

## P2. 배포 전 같이 정리하면 좋은 항목

### 5. `NEXT_PUBLIC_APP_URL` localhost fallback이 운영 링크와 보안 옵션에 영향을 준다

- 코드 근거:
  - [src/lib/utils.ts](/Users/gangjingu/project/Quit-codex/src/lib/utils.ts:60)
  - [src/app/sitemap.ts](/Users/gangjingu/project/Quit-codex/src/app/sitemap.ts:4)
  - [src/lib/auth.ts](/Users/gangjingu/project/Quit-codex/src/lib/auth.ts:33)
  - [.env.example](/Users/gangjingu/project/Quit-codex/.env.example:10)
- 현상:
  - 기본 base URL이 `http://localhost:3000`이다.
  - 이 값은 결과 메일 링크, 수신거부 링크, sitemap URL, 관리자 쿠키 `secure` 판단에 모두 재사용된다.
- 왜 위험한가:
  - 운영에서 env를 빼먹으면 메일 링크와 sitemap이 localhost를 가리킬 수 있다.
  - `shouldUseSecureCookie()`도 localhost 기반으로 판단해 운영 쿠키가 `secure: false`가 될 수 있다.
- 권장 수정:
  - production에서는 base URL이 없으면 실패하게 한다.
  - `.env.example`는 운영값 예시 또는 빈 값으로 두고, 배포 문서에 실도메인 설정을 명시한다.

### 6. 수신거부 토큰이 `Math.random()` 기반이라 capability URL 용도로는 약하다

- 코드 근거:
  - [src/lib/utils.ts](/Users/gangjingu/project/Quit-codex/src/lib/utils.ts:56)
  - [src/app/api/contact/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/contact/route.ts:38)
- 현상:
  - `unsubscribeToken` 생성에 `createId('unsub')`를 사용하고 있고, 내부 구현은 `Math.random()` 기반 문자열이다.
- 왜 위험한가:
  - 수신거부 URL은 사실상 권한 토큰인데, 이 용도로는 암호학적 난수가 아니라는 점이 아쉽다.
- 권장 수정:
  - `crypto.randomUUID()` 또는 `crypto.randomBytes(32).toString('hex')`로 교체한다.
  - 내부 저장용 ID와 외부 노출 capability token은 생성 방식을 분리한다.

### 7. UI 플로우 Playwright 검증이 현재 신뢰 가능한 배포 게이트로 동작하지 않는다

- 코드 근거:
  - [scripts/verify-ui-flow-playwright.cjs](/Users/gangjingu/project/Quit-codex/scripts/verify-ui-flow-playwright.cjs:21)
  - [src/app/page.tsx](/Users/gangjingu/project/Quit-codex/src/app/page.tsx:52)
- 현상:
  - 현재 환경에서 첫 CTA 대기 단계에서 타임아웃이 났다.
  - 동일 문구는 실제 HTML 응답에는 존재한다.
- 왜 위험한가:
  - 배포 전에 “핵심 사용자 플로우가 끝까지 된다”는 자동 증거가 비어 있다.
  - 실제 앱 문제인지 Playwright/Chrome 환경 문제인지 아직 분리되지 않았다.
- 권장 수정:
  - 스크립트에 첫 화면 스냅샷과 `page.content()` 로깅을 추가해 원인을 먼저 분리한다.
  - 실패 시 바로 어떤 selector에서 막혔는지 출력하도록 진단성을 높인다.
  - 배포 게이트로 쓸 거면 CI에서 같은 방식으로 안정 재현되는지 확인한다.

## 배포 담당자 액션 가이드

이 섹션은 “코드 수정”이 아니라, 실제 배포를 위해 사용자가 해야 하는 운영 작업만 정리한 것이다.
현재 코드 상태를 기준으로 작성했기 때문에, 아래 순서는 거의 그대로 따라가면 된다.

### 1. 배포 전에 먼저 정해야 하는 것

- 운영 도메인
  - 예: `quit.example.com`
- 운영 DB를 Preview와 분리할지 여부
  - 권장: `Production DB`와 `Preview DB` 분리
- 운영 관리자 이메일
- 결과 메일 발신 도메인
  - 예: `mail.example.com`

### 2. Supabase에서 해야 할 일

#### 2-1. 프로젝트 생성

- Supabase에서 새 프로젝트를 만든다.
- 한국 사용자 대상이면 사용자와 가까운 리전을 고른다.
- 데이터베이스 비밀번호를 안전하게 보관한다.

#### 2-2. 연결 문자열 확보

현재 Prisma 스키마는 [prisma/schema.prisma](/Users/gangjingu/project/Quit-codex/prisma/schema.prisma:7) 기준으로 `DATABASE_URL`과 `DIRECT_URL`을 모두 받는다.

실무 권장 매핑은 다음과 같다.

- `DATABASE_URL`
  - Vercel 런타임용
  - Supabase `Supavisor transaction mode` 문자열
  - 보통 포트 `6543`
- `DIRECT_URL`
  - Prisma migration용
  - Supabase direct connection 문자열
  - 보통 `db.<project-ref>.supabase.co:5432`

현재 서비스는 Vercel 같은 서버리스 환경을 전제로 하고 있으므로, 이 매핑이 가장 안전하다.

#### 2-3. Prisma 마이그레이션 적용

이 저장소의 현재 `build` 스크립트는 `seed`와 `next build`는 수행하지만, DB migration 배포는 하지 않는다.

- 코드 근거:
  - [package.json](/Users/gangjingu/project/Quit-codex/package.json:5)

따라서 운영 배포 전에는 아래 둘 중 하나를 반드시 해야 한다.

1. 수동/CI에서 `npx prisma migrate deploy`를 먼저 실행한다.
2. 별도 배포 스크립트를 추가하고 Vercel Build Command를 그 스크립트로 바꾼다.

현재 상태에서는 최소한 첫 배포 전에 아래 순서가 필요하다.

```bash
npx prisma migrate deploy
```

그 다음 Supabase SQL Editor 또는 Table Editor에서 아래 테이블이 생성됐는지 확인한다.

- `UserResult`
- `UserContact`
- `AnalyticsEvent`
- `AdminUser`

#### 2-4. 운영 관리자 계정 직접 생성

현재 코드에서는 운영 모드에서 env만으로 관리자 계정이 생기지 않는다.
즉, `AdminUser` 테이블에 직접 1건을 넣어야 한다.

비밀번호 해시는 로컬에서 아래처럼 만들 수 있다.

```bash
node -e "console.log(require('bcryptjs').hashSync('여기에-운영-비밀번호', 10))"
```

생성한 해시를 사용해 DB에 `AdminUser`를 넣는다.
예시는 SQL Editor 기준이다.

```sql
insert into "AdminUser" ("id", "email", "passwordHash", "createdAt")
values (
  'admin_seed_primary',
  'admin@example.com',
  '$2b$10$REPLACE_WITH_BCRYPT_HASH',
  now()
);
```

주의:

- Prisma 스키마의 `id`는 `cuid()`지만, DB 레벨에서 텍스트 primary key만 만족하면 로그인에는 문제가 없다.
- 더 깔끔하게 하려면 이후 `prisma db seed` 또는 bootstrap 스크립트로 자동화하는 편이 좋다.

### 3. Vercel에서 해야 할 일

#### 3-1. 프로젝트 연결

- GitHub 저장소를 Vercel 프로젝트로 연결한다.
- production branch는 `main`으로 맞춘다.

#### 3-2. Build Command 명시

이 저장소는 단순 `next build`가 아니라 `npm run seed && npm run verify:repo && next build`가 필요하다.
따라서 Vercel Project Settings에서 Build Command를 명시적으로 `npm run build`로 두는 편이 안전하다.

추천 설정:

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`

만약 migration까지 자동화했다면:

- Build Command: `npm run vercel-build`

#### 3-3. 환경변수 등록

Vercel에는 환경변수를 Production과 Preview에 각각 넣어야 한다.
환경변수 변경은 기존 배포에 소급 적용되지 않으므로, 값을 바꾼 뒤에는 새 배포가 필요하다.

현재 코드 기준 분류는 다음과 같다.

##### Production 필수

- `DATABASE_URL`
- `DIRECT_URL`
- `ENCRYPTION_KEY`
  - 64자리 hex
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_APP_URL`
  - 예: `https://quit.example.com`
- `RESEND_API_KEY`

##### 있으면 좋은 값

- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_ADSENSE_ID`

##### 현재 코드 기준 미사용 또는 사실상 선택

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`

이 값들은 현재 런타임에서 직접 소비되지 않거나, 운영 Prisma 경로에서는 효과가 없다.
특히 관리자 계정은 env가 아니라 DB 레코드로 만들어야 한다.

#### 3-4. Preview 환경 권장 설정

- `DATABASE_URL`, `DIRECT_URL`은 가능하면 Preview 전용 DB로 분리
- `NEXT_PUBLIC_APP_URL`은 Vercel preview URL에 맞는 값 사용 또는 Preview에서는 비워 두고 기능 테스트만 수행
- `RESEND_API_KEY`는 Preview에 넣더라도 실제 외부 발송이 나가지 않게 제한된 발신 정책을 권장

### 4. Resend에서 해야 할 일

#### 4-1. 도메인 검증

- Resend에서 발송 도메인 또는 발송 전용 서브도메인을 추가한다.
- DNS에 SPF, DKIM 레코드를 넣고 `verified` 상태가 될 때까지 확인한다.

권장:

- 루트 도메인보다 메일 전용 서브도메인 사용
  - 예: `mail.example.com`

#### 4-2. API 키 발급

- Production용 API 키를 만든다.
- 그 값을 Vercel `RESEND_API_KEY`에 넣는다.

#### 4-3. 현재 코드에서 추가로 필요한 것

현재 `/api/contact`는 발신자 주소를 아래처럼 고정하고 있다.

- [src/app/api/contact/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/contact/route.ts:45)

즉, Resend에서 도메인 검증만 해서는 끝나지 않고 아래 둘 중 하나가 더 필요하다.

1. 코드에서 `from`을 실제 검증 도메인 주소로 바꾼다.
2. `EMAIL_FROM` 같은 env 기반으로 발신자를 분리한다.

이걸 안 바꾸면 운영 메일 발송은 정상화되지 않는다.

### 5. 실제 배포 순서

현재 코드 기준 추천 순서는 아래다.

1. Supabase 프로젝트 생성
2. `DATABASE_URL`, `DIRECT_URL` 확보
3. `npx prisma migrate deploy` 실행
4. `AdminUser` 1건 생성
5. Resend 도메인 검증 + API 키 발급
6. Vercel 프로젝트 생성
7. Vercel Production env 입력
8. Vercel Build Command를 `npm run build`로 확인
9. 첫 Production 배포
10. 커스텀 도메인 연결
11. `NEXT_PUBLIC_APP_URL`을 최종 도메인으로 맞춘 뒤 재배포

### 6. 첫 배포 후 반드시 직접 확인할 것

- 랜딩 진입
- Step 1 → Step 2 → Step 3 → Loading → Ad → Result 전체 완주
- 결과 저장 후 `/result/{sessionId}` 재접속 가능
- 이메일 제출 후 실제 메일 수신
- 수신거부 링크 작동
- `/admin` 로그인 가능
- `/api/admin/stats`, `/api/admin/export` 정상 응답
- sitemap URL이 localhost가 아닌 실제 도메인을 반환하는지 확인

### 7. 사용자가 지금 바로 준비해야 할 값

배포 전에 아래 값들을 미리 준비해두면 된다.

- 운영 도메인명
- Supabase 프로젝트와 DB 비밀번호
- Production `DATABASE_URL`
- Production `DIRECT_URL`
- `ENCRYPTION_KEY`
  - 예: `openssl rand -hex 32`
- `ADMIN_SESSION_SECRET`
  - 충분히 긴 랜덤 문자열
- 운영 관리자 이메일
- 운영 관리자 비밀번호
- Resend API 키
- 메일 발신 도메인

## 공식 문서 참고

- Supabase Prisma 가이드: https://supabase.com/docs/guides/database/prisma
- Supabase Supavisor FAQ: https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI
- Prisma migrate deploy: https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate
- Vercel getting started: https://vercel.com/docs/getting-started-with-vercel
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel custom domain: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Resend domain verification: https://resend.com/docs/dashboard/domains/introduction

## 지난 리뷰 대비 해결된 항목

2026-04-12 리뷰 기준의 일부 주요 이슈는 현재 코드에서 정리된 것으로 보인다.

- 자격증 hard filter 제외가 실제로 반영됨
  - [src/lib/matching.ts](/Users/gangjingu/project/Quit-codex/src/lib/matching.ts:170)
  - [src/lib/matching.ts](/Users/gangjingu/project/Quit-codex/src/lib/matching.ts:203)
- Prisma 사용 조건이 `DATABASE_URL` 중심으로 단순화됨
  - [src/lib/prisma.ts](/Users/gangjingu/project/Quit-codex/src/lib/prisma.ts:8)
- 결과 페이지 `다시 진단하기`가 스토어 reset 후 이동함
  - [src/components/result/ResultPageClient.tsx](/Users/gangjingu/project/Quit-codex/src/components/result/ResultPageClient.tsx:103)
- 연락처 저장 후 메일 실패를 전체 500으로 처리하지 않음
  - [src/app/api/contact/route.ts](/Users/gangjingu/project/Quit-codex/src/app/api/contact/route.ts:43)
- 이메일 HTML escape 처리가 들어감
  - [src/lib/email-template.ts](/Users/gangjingu/project/Quit-codex/src/lib/email-template.ts:9)

다만 연락처 API는 “저장 성공과 발송 성공 분리”까지는 개선됐지만, 지금은 반대로 발송 실패를 너무 조용히 숨기는 상태라 운영 UX 관점에서 추가 보완이 필요하다.

## 배포 체크리스트

### 코드 수정

- production에서 DB/env 미설정 fallback 금지
- 관리자 토큰 만료 검사 추가
- 보호 라우트에서 관리자 실존 여부 재검증
- 이메일 발송 성공 여부를 API 응답에 명시
- `unsubscribeToken`을 crypto 기반으로 교체

### 운영 설정

- `DATABASE_URL`
- `ENCRYPTION_KEY` (`64` hex)
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- 실제 발송 가능한 이메일 sender 도메인
- 운영 관리자 계정(`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` 또는 DB seeded admin)

### 검증

- `npm test`
- `npm run lint`
- `npm run build`
- `node scripts/verify-diversity-playwright.cjs`
- `node scripts/verify-ui-flow-playwright.cjs` 복구 후 재실행

## 한 줄 판단

추천 엔진과 기본 앱 빌드는 배포 가능한 수준에 가깝다.
하지만 운영 보안과 운영 설정 실패 감지 쪽이 아직 느슨해서, “실서비스 배포” 기준으로는 위 P1 정리 후 올리는 편이 안전하다.
