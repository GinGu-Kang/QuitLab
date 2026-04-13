# Phase 7: SEO + 분석 + 관리자 대시보드 + 배포

> **사전 조건**: Phase 6 완료 (전체 사용자 기능)
> **산출물**: 프로덕션 배포, SEO, GA4, 관리자 대시보드
> **예상 파일 수**: ~15-20개

---

## ⚠️ 사용자 액션 필요

1. **GA4**: https://analytics.google.com → 속성 생성 → `NEXT_PUBLIC_GA_ID=G-XXXX`
2. **AdSense**: https://adsense.google.com → 사이트 등록 → `NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXX`
   - 승인까지 2-4주 소요. 플레이스홀더로 진행 가능.
3. **Vercel**: https://vercel.com → GitHub 연결 → 환경변수 설정
4. **(선택) 커스텀 도메인**: Vercel에서 도메인 연결
5. **관리자 계정**: DB에 AdminUser 수동 생성 (bcrypt 해시)

---

## 7-1. SEO

### `src/app/layout.tsx` 수정 — JSON-LD + GA4

```typescript
// 정적 메타데이터
export const metadata: Metadata = {
  title: '퇴사하면 나는 어떤 가게 사장님? | 창업 적합도 진단',
  description: '12개 역량 × 129개 업종 매칭으로 나에게 딱 맞는 창업 아이템을 찾아보세요. 현실 수익, 투자비, 창업 가이드까지.',
  openGraph: {
    title: '퇴사하면 나는 어떤 가게 사장님?',
    description: '나만의 창업 아이템 찾기 - 3분 무료 진단',
    type: 'website',
    locale: 'ko_KR',
  },
};
```

JSON-LD 구조화 데이터:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "퇴사하면 나는 어떤 가게 사장님?",
  "description": "창업 적합도 진단 서비스",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web"
}
</script>
```

GA4 스크립트 삽입:
```tsx
{process.env.NEXT_PUBLIC_GA_ID && (
  <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
    <Script id="gtag-init" strategy="afterInteractive">
      {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
    </Script>
  </>
)}
```

### `src/app/result/[sessionId]/page.tsx` 수정 — 동적 OG

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const result = await prisma.userResult.findUnique({
    where: { sessionId: params.sessionId },
  });
  if (!result) return {};

  const top5 = result.top5Results as MatchResult[];
  const topItem = top5[0]?.item.name || '맞춤 업종';

  return {
    title: `나의 창업 적합 업종: ${topItem} | 퇴사하면 나는`,
    description: `129개 업종 분석 결과, 가장 적합한 창업 아이템은 "${topItem}"입니다.`,
    openGraph: {
      title: `퇴사하면 나는 ${topItem}이 딱이래 🤔`,
      description: '너는 뭐 나오는지 해봐! 3분 무료 창업 진단',
    },
  };
}
```

### `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://[도메인]/sitemap.xml
```

### `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://[도메인]', lastModified: new Date(), priority: 1.0 },
    { url: 'https://[도메인]/privacy', lastModified: new Date(), priority: 0.3 },
    { url: 'https://[도메인]/terms', lastModified: new Date(), priority: 0.3 },
  ];
}
```

---

## 7-2. GA4 이벤트 트래킹

### `src/lib/analytics.ts`

```typescript
type EventName =
  | 'landing_view'
  | 'step1_start' | 'step1_complete'
  | 'step2_complete'
  | 'step3_complete'
  | 'ad_watched'
  | 'result_view'
  | 'share_click_kakao' | 'share_click_copy'
  | 'email_submit';

export function trackEvent(name: EventName, params?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params);
  }
}
```

이벤트 삽입 위치:
| 이벤트 | 위치 |
|---|---|
| `landing_view` | `src/app/page.tsx` (마운트 시) |
| `step1_start` | `src/app/diagnose/step-1/page.tsx` (마운트 시) |
| `step1_complete` | step-1 → step-2 이동 시 |
| `step2_complete` | step-2 → step-3 이동 시 |
| `step3_complete` | step-3 완료 시 |
| `ad_watched` | `src/app/ad/page.tsx` (카운트다운 완료 시) |
| `result_view` | `src/app/result/[sessionId]/page.tsx` (마운트 시) |
| `share_click_*` | ShareButtons 컴포넌트 |
| `email_submit` | EmailCollector 성공 시 |

---

## 7-3. 광고 컴포넌트

### `src/components/AdBanner.tsx`

```typescript
// Google AdSense 삽입
// NEXT_PUBLIC_ADSENSE_ID가 없으면 플레이스홀더 표시
// 사용 위치: /ad 페이지, /result 페이지 하단
```

---

## 7-4. 관리자 대시보드

### `src/app/admin/layout.tsx` — 인증 가드

MVP: 간단한 패스워드 인증 (세션 기반)
```typescript
// 로그인 폼 → POST /api/admin/auth → 성공 시 세션 쿠키 발급
// 쿠키 없으면 로그인 폼 표시
```

### `src/app/api/admin/auth/route.ts`

```typescript
// POST: email + password → AdminUser 조회 → bcrypt 비교
// 성공: httpOnly 쿠키 설정
// 실패: 401
```

### `src/app/admin/page.tsx` — 대시보드

Recharts로 시각화:
```
1. 전체 참여자 수 (UserResult count)
2. 일별 참여 추이 (LineChart, 최근 30일)
3. 인기 추천 업종 TOP 10 (BarChart — top5Results에서 집계)
4. 전환 퍼널:
   - 랜딩 → Step 1 시작
   - → Step 1 완료
   - → Step 2 완료
   - → Step 3 완료
   - → 광고 시청
   - → 결과 확인
   - → 이메일 제출
   (AnalyticsEvent에서 집계)
```

### `src/app/api/admin/stats/route.ts`

```typescript
// 관리자 인증 확인 후:
// 1. 총 참여자: prisma.userResult.count()
// 2. 일별: prisma.userResult.groupBy({ by: ['createdAt'], _count: true })
// 3. TOP 10: top5Results JSON에서 1위 아이템 집계
// 4. 퍼널: prisma.analyticsEvent.groupBy({ by: ['eventType'], _count: true })
// 5. 이메일 수집률: userContact count / userResult count
```

### `src/app/admin/customers/page.tsx` ��� 고객 DB

```
테이블:
- 이름, 이메일, 동의 여부 (개인정보/마케팅), 가입일
- 검색: 이름 or 이메일로 필터
- 필터: 마케팅 동의만 / 전체
- CSV 내보내기 버튼 (마케팅 동의자만)
  → /api/admin/export GET → CSV 다운로드
```

### `src/app/api/admin/export/route.ts`

```typescript
// 마케팅 동의 + 수신거부 안 한 사용자만
// 이름, 이메일 (전화번호는 암호화 상태라 제외)
// CSV 형식 응답 (Content-Type: text/csv)
```

---

## 7-5. 배포 설정

### Vercel 환경변수 설정 목록

```
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ENCRYPTION_KEY
RESEND_API_KEY
NEXT_PUBLIC_GA_ID
NEXT_PUBLIC_ADSENSE_ID
```

### `vercel.json` (필요 시)

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

---

## 검증 체크리스트

```
SEO:
- Lighthouse SEO 95+ (localhost에서 측정)
- robots.txt 접근 가능
- sitemap.xml 접근 가능
- 결과 페이지 OG 태그 확인 (curl -I 또는 Facebook 디버거)

분석:
- GA4 Realtime에서 이벤트 수신 확인
- 전체 플로우 1회 완주 → 10개 이벤트 모두 발생

광고:
- /ad 페이지에 AdSense 또는 플레이스홀더 표시
- /result 하단에 배너

관리자:
- /admin 접속 → 로그인 폼
- 로그인 후 대시보드 표시
- 통계 정확 (총 참여자, 일별 트렌드 차트)
- 고객 목록 검색/필터
- CSV 내보내기: 마케팅 동의자만 포함

배포:
- Vercel URL에서 전체 플로우 동작
- 랜딩 → 퀴즈 → 결과 → 이메일 전체 완주
- HTTPS 정상
- 모바일 375px 깨짐 없음

성능:
- Lighthouse Performance 90+
- API 응답 < 500ms
- 매칭 연산 < 100ms
```

---

## 최종 통합 검증 (모든 Phase 완료 후)

```
✅ 기능: 랜딩 → 결과 → 이메일 전체 플로우 5분 이내 완주
✅ 결정론적: 동일 답변 2회 → 동일 결과
✅ 다양성: 다른 답변 → 유의미하게 다른 TOP 5
✅ 데이터: 129개 업종, 24문항, 10문항, 8필터 모두 반영
✅ 가중치: 50/30/10/10 정확
✅ 법률: 개인정보처리방침, 이용약관, 동의UI, 수신거부
✅ 보안: 전화번호 암호화, IP 해싱
✅ 성능: Lighthouse 90+, API <500ms, 매칭 <100ms
✅ 모바일: 375px 깨짐 없음, 터치 44x44px
```
