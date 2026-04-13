# Phase 6: 결과 페이지 — 확장 기능 (가이드 + 미래 + 이메일 + 공유)

> **사전 조건**: Phase 3 (DB, 암호화), Phase 5 (결과 페이지 셸)
> **산출물**: "가이드"/"미래상상" 탭 + 이메일 수집 + 소셜 공유 + 법적 페이지
> **예상 파일 수**: ~15-18개

---

## ⚠️ 사용자 액션 필요 (이메일 기능 테스트 전)

1. https://resend.com 계정 생성
2. 발신 도메인 인증 (또는 resend.dev 테스트 도메인 사용)
3. `.env.local`에 추가: `RESEND_API_KEY=re_xxxx`

---

## 6-1. 가이드 탭 컴포넌트

### `src/components/result/StartupGuide.tsx`

JSX line 775-810 ("guide" 탭):

**아코디언 구조** (TOP 5 아이템별):
```
- 닫힌 상태: 순위 + 아이템명 | 투자비 + ▼
- 열린 상태: border-color → #10B981
  ├── 📊 현실 수익 (item.real — 엑셀 ① 시트 데이터)
  │   - 평균 월매출, 영업이익률, 손익분기, 특이사항
  ├── 🎯 창업 가이드 (item.guide)
  │   - 핵심 준비사항, 차별화 전략
  └── 💰 비용 구조
      - 임대/시설: 35~45% (틸 바)
      - 인테리어/장비: 25~35% (퍼플 바)
      - 운영자금: 15~25% (금색 바)
      - 마케팅/인허가: 5~15% (핑크 바)
```

> 비용 구조는 JSX line 799-806에 하드코딩되어 있음.
> 향후 엑셀 데이터에서 업종별 비율을 가져오도록 확장 가능하지만,
> 현재는 JSX의 일반적 비율을 사용.

### `src/components/result/ChecklistCard.tsx`

JSX line 812-818:

```
✅ 창업 전 필수 체크리스트:
☐ 사업자등록증 발급 (세무서, 무료)
☐ 업종별 인허가 확인
☐ 사업자 통장 개설
☐ 간이과세 vs 일반과세 선택
☐ 임대차 계약 전 권리금, 상권분석
☐ 소상공인 정책자금 확인
☐ 화재, 배상책임보험 가입
☐ 세무사 선임 (월 10~15만원)
```

### `src/components/result/GovernmentSupport.tsx`

JSX line 821-829:

```
🏛️ 정부지원:
- 소상공인 정책자금: 최대 7천만원 저금리 대출
- 청년창업사관학교: 최대 1억+공간
- 초기창업패키지: 최대 1억 사업화자금
- 비수도권 법인세감면: 5년간 50% 감면
```

### `src/components/result/Roadmap.tsx`

IMPLEMENTATION_PLAN에서 정의한 타임라인:

```
D-90 ─── D-60 ─── D-30 ─── 개업일 ─── +3개월 ─── +6개월

D-90: 사업 타당성 조사, 상권 분석
D-60: 사업자등록, 인테리어 착수, 자금 조달
D-30: 메뉴/상품 확정, 직원 채용, 마케팅 준비
개업일: 그랜드 오프닝
+3개월: 손익분기 점검, 고객 피드백 반영
+6개월: 안정화, 확장 전략 수립

- 타임라인 시각화: 수평 점선 + 각 단계 카드
- 틸→금색 그래디언트 진행
```

---

## 6-2. 미래상상 탭 컴포넌트

### `src/components/result/FutureVision.tsx`

JSX line 734-771 ("future" 탭):

```
안내 박스 (퍼플):
"💭 진지한 분석은 위 탭에서 다 봤죠? 여기서는 잠깐 상상해봐요."

미래 카드 (그래디언트 배경):
  — 2036년 —
  [👤 아바타 (72px 원, 틸→퍼플 그래디언트)]
  "{닉네임} 대표"
  "{아이템명} · {카테고리}"

  인터뷰 인용:
  "{아이템명} 일이 적성에 맞아서, 매일 매장 나가는 게 즐거워요.
   단골손님들과 인사하는 게 하루의 낙입니다."
  — 2036년 {닉네임} 대표 인터뷰 中
```

> futureYear = 현재연도 + 10

### `src/components/result/ShareButtons.tsx`

JSX line 751-753:

```
"이 결과, 친구 의견도 들어볼까요?" (dim, 11px)

[📸 결과 공유하기] — 핑크→퍼플 그래디언트 버튼
  → navigator.clipboard.writeText(window.location.href)
  → toast("링크가 복사되었어요!")
  → 공유 메시지: "퇴사하면 나는 {아이템명}이 딱이래 🤔 너는 뭐 나오는지 해봐"

[💬 카카오톡으로 보내기] — 카드 스타일 버튼 (금색 텍스트)
  → 카카오 SDK 연동 (Phase 7에서 완성, 여기서는 링크 복사 대체)
```

### `src/components/result/EmailCollector.tsx`

JSX line 756-771:

```
📧 분석 결과 저장하기
"이 페이지를 닫으면 다시 보기 어려워요. 나중에 천천히 다시 보고 싶다면 이메일로 받아두세요."

[이름 input]
[이메일 input]
[전화번호 input]

☐ (필수) 개인정보 수집 및 이용에 동의합니다  [전문 보기 →]
☐ (선택) 창업 관련 유용한 정보를 받아보겠습니다  [전문 보기 →]

[결과 받기] primary 버튼
```

클라이언트 Zod 검증:
```typescript
const contactSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  phone: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 전화번호를 입력해주세요'),
  privacyConsent: z.literal(true, { errorMap: () => ({ message: '개인정보 수집 동의가 필요합니다' }) }),
  marketingConsent: z.boolean(),
});
```

→ POST `/api/contact` 호출 → 성공 시 toast("결과를 이메일로 보내드렸어요!")

---

## 6-3. 이메일 수집 API

### `src/app/api/contact/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  // 1. 검증
  const parsed = contactInputSchema.parse(body);

  // 2. sessionId 유효성 확인
  const userResult = await prisma.userResult.findUnique({
    where: { sessionId: parsed.sessionId },
  });
  if (!userResult) return NextResponse.json({ error: 'Invalid session' }, { status: 404 });

  // 3. 전화번호 암호화 + 해시
  const phoneEncrypted = encryptPhone(parsed.phone);
  const phoneHash = hashPhone(parsed.phone);

  // 4. IP/UA 기록
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  // 5. UserContact 생성
  await prisma.userContact.create({
    data: {
      userResultId: userResult.id,
      name: parsed.name,
      email: parsed.email,
      phoneEncrypted,
      phoneHash,
      privacyConsent: parsed.privacyConsent,
      privacyConsentAt: new Date(),
      marketingConsent: parsed.marketingConsent,
      marketingConsentAt: parsed.marketingConsent ? new Date() : null,
      consentIpHash: hashIp(ip),
      consentUserAgent: req.headers.get('user-agent'),
    },
  });

  // 6. Resend로 이메일 발송
  await sendResultEmail(parsed.email, parsed.name, userResult);

  return NextResponse.json({ success: true });
}
```

### `src/lib/resend.ts`

```typescript
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
```

### `src/lib/email-template.ts`

HTML 이메일 템플릿:
```
Subject: "{닉네임}님의 창업 적합도 진단 결과 📊"

내용:
- TOP 5 추천 업종 요약 (순위, 이름, 카테고리, 적합도)
- 1위 업종 상세 (추천 이유, 현실 수익)
- 역량 GAP 요약 (부족한 역량 목록)
- 보완 가이드 핵심 포인트
- CTA: "자세한 결과 다시 보기 →" (result URL)
- 수신거부 링크 (마케팅 동의자만)
```

---

## 6-4. 수신거부

### `src/app/unsubscribe/[token]/page.tsx`

```
1. token으로 UserContact 조회
2. 없으면 "유효하지 않은 링크"
3. 있으면 "수신거부 처리하시겠습니까?" + 확인 버튼
4. 확인 시 → API 호출 → unsubscribedAt 업데이트
5. "수신거부가 완료되었습니다" 메시지
```

---

## 6-5. 법적 페이지

### `src/app/privacy/page.tsx`

개인정보 처리방침:
```
- 수집 항목: 이름, 이메일, 전화번호
- 수집 목적: 진단 결과 발송, 마케팅 (동의 시)
- 보유 기간: 1년 (마케팅 동의 철회 시 즉시 삭제)
- 제3자 제공: 없음
- 개인정보 보호 책임자: [TBD]
- 권리: 열람, 정정, 삭제, 처리정지 요구 가능
```

### `src/app/terms/page.tsx`

이용약관:
```
- 서비스 개요
- 진단 결과의 비보증 (투자 조언 아님)
- 책임 제한
- 지식재산권
```

---

## 검증 체크리스트

```
1. 가이드 탭:
   - 아코디언 열기/닫기 동작
   - 현실 수익, 창업 가이드, 비용 구조 표시
   - 체크리스트 8개 항목
   - 정부지원 4개 프로그램
   - 로드맵 타임라인 렌더링

2. 미래상상 탭:
   - 미래 연도 = 현재 + 10
   - 닉네임, 아이템명 정확히 표시
   - 인터뷰 텍스트 아이템에 맞게 표시

3. 이메일 수집:
   - 개인정보 동의 미체크 시 제출 차단
   - 이메일 형식 검증
   - 전화번호 형식 검증
   - POST /api/contact → UserContact 생성 확인
   - 전화번호가 DB에 암호화 저장 확인 (Prisma Studio)
   - Resend 이메일 실제 수신 확인 (API 키 설정 후)

4. 공유:
   - "결과 공유하기" → 클립보드에 URL 복사
   - toast 알림 표시

5. 수신거부:
   - /unsubscribe/[유효한토큰] → 수신거부 확인 UI
   - 확인 후 DB에 unsubscribedAt 기록

6. 법적 페이지:
   - /privacy 정상 렌더링
   - /terms 정상 렌더링
   - EmailCollector에서 "전문 보기" 클릭 시 연결
```
