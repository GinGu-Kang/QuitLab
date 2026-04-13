# Phase 5: 결과 페이지 — 핵심 컴포넌트 (TOP 5 + 차트 + GAP 분석)

> **사전 조건**: Phase 2 (매칭 결과 구조), Phase 4 (퀴즈 플로우)
> **산출물**: 결과 페이지의 "추천" + "분석근거" 탭
> **예상 파일 수**: ~12-15개

---

## 5-1. 결과 페이지 셸

### 파일: `src/app/result/[sessionId]/page.tsx`

```
1. URL에서 sessionId 추출
2. /api/result/[sessionId] GET으로 데이터 fetch (서버 컴포넌트 또는 client-side)
3. 4탭 네비게이션 렌더링
4. 각 탭 컴포넌트에 데이터 전달
```

### 4탭 구조 (JSX line 621-642 참조)

```tsx
const tabs = [
  { key: 'match',  label: '🏆 추천',     color: '#0D9488' },
  { key: 'why',    label: '💡 분석근거',  color: '#F59E0B' },
  { key: 'guide',  label: '📋 가이드',    color: '#10B981' },
  { key: 'future', label: '✨ 미래상상',  color: '#8B5CF6' },
];
```

탭 버튼 스타일 (JSX line 634-638):
- 선택됨: `border-color: [탭컬러], background: [탭컬러]22, color: [탭컬러]`
- 미선택: `border-quiz-border bg-quiz-card text-quiz-text-dim`
- 공통: `flex-1 rounded-[10px] py-[7px] px-1 text-[11px] font-semibold`

### 상단 헤더 (JSX line 627-630)

```
"{닉네임}님, 데이터 분석이 끝났어요" (틸 컬러, 12px, font-semibold)
"129개 업종 × 12개 역량 × 현실 조건 교차 분석 결과" (dim, 10px)
```

---

## 5-2. 추천 탭 컴포넌트

### `src/components/result/DiagnosisSummary.tsx`

JSX line 646-650 + getType 함수 (line 388-398):

```
사용자 유형 배지:
- 배경: rgba(13,148,136,0.08), 보더: rgba(13,148,136,0.25), rounded-[14px]
- "당신의 진단 결과" (회색, 11px)
- 유형명 (그래디언트 텍스트, 18px, font-extrabold)
  예: "전략형 사장님", "감성 장인", "인싸 사장님" 등
- 유형 설명 (dim, 12px)
```

유형 결정 로직 (JSX getType 함수):
```typescript
function getType(scores: number[]) {
  const sorted = scores.map((s, i) => ({ s, i })).sort((a, b) => b.s - a.s);
  const t1 = sorted[0].i;
  if ([0, 3, 9].includes(t1)) return { name: '전략형 사장님', desc: '데이터로 판단하고 계획대로 실행하는 타입' };
  if ([1, 7, 11].includes(t1)) return { name: '감성 장인', desc: '예쁘게 만들고 트렌디하게 표현하는 타입' };
  if ([2, 4].includes(t1)) return { name: '인싸 사장님', desc: '사람을 끌어모으고 관계로 성장하는 타입' };
  if ([5, 8].includes(t1)) return { name: '현장형 파이터', desc: '몸으로 뛰며 성실함으로 승부하는 타입' };
  if ([6].includes(t1)) return { name: '도전형 개척자', desc: '남들이 안 하는 걸 과감하게 시작하는 타입' };
  if ([10].includes(t1)) return { name: '보스형 리더', desc: '팀을 만들고 키워서 사업을 확장하는 타입' };
  return { name: '올라운더 CEO', desc: '골고루 잘하는 균형 잡힌 타입' };
}
```

### `src/components/result/Top5Cards.tsx`

JSX line 652-672:

**1위 히어로 카드:**
```
- 배경: rgba(13,148,136,0.1), 보더: 2px solid #0D9488, rounded-[16px]
- 왼쪽 상단 배지: "🏆 1순위 추천" (금색 배경, 검정 글자, 절대위치 top:-8)
- 아이템명 (19px, font-extrabold)
- 카테고리 · 투자비 (틸, 금색)
```

**리스크 경고 배너** (JSX line 658-662):
```
- 배경: rgba(239,68,68,0.06), 보더: rgba(239,68,68,0.25)
- "⚠️ 알고 시작하세요" (빨강, 11px, bold)
- "추천 = 성공 보장 아닙니다. 가이드 탭에서 폐업률·경쟁강도·실제 수익을 꼭 확인하세요."
```

**2-5위 그리드** (2×2):
```
- 각 카드: bg-quiz-card, border-quiz-border, rounded-[12px], p-3
- 순위: 🥈 2위, 🥉 3위, 4위, 5위
- 아이템명 (14px, bold), 투자비 (dim, 11px)
```

### `src/components/result/RadarChart.tsx`

JSX의 SVG 레이더 차트 (line 400-413) → **Recharts 버전**:

```tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

// 데이터 구조:
const data = COMPETENCY_LABELS.map((label, i) => ({
  label,
  user: userScores[i],
  required: top1RequiredScores[i],
}));

// Recharts RadarChart:
// - 12축 (COMPETENCY_LABELS)
// - 사용자 점수: 틸 (fill rgba(13,148,136,0.2), stroke #0D9488)
// - 1위 요구 점수: 금색 (fill rgba(245,158,11,0.1), stroke #F59E0B)
// - PolarGrid: #1E293B
// - PolarAngleAxis: #94A3B8, 8.5px
// - 범위: 0~5
```

> 레이더 차트 아래에 12개 역량 점수 미니 바 그리드 (JSX line 676-686):
> 2열 그리드, 각 셀에 아이콘 + 역량명 + 5칸 바 (4이상 틸, 3 금색, 2이하 빨강)

### 12역량 점수 바 (JSX line 676-686)

```
- 2열 그리드 (grid-cols-2 gap-[5px])
- 각 셀: bg-quiz-card rounded-lg px-2 py-1.5 flex items-center gap-[5px]
  - 아이콘 (13px)
  - 역량명 (10px, dim, flex-1)
  - 5칸 바: [1,2,3,4,5].map → width:11, height:5, rounded-sm
    - 채워짐: 4이상 #14B8A6, 3 #F59E0B, 2이하 #EF4444
    - 빔: #1E293B
```

---

## 5-3. 분석근거 탭 컴포넌트

### `src/components/result/WhyRecommended.tsx`

JSX line 690-731 ("why" 탭):

**헤더:**
```
- 배경: rgba(245,158,11,0.08), 보더: rgba(245,158,11,0.2)
- "왜 이 자영업이 추천되었을까?" (금색, 13px, bold)
- "12가지 역량 + 자금 + 경험을 종합 분석한 결과예요." (회색, 12px)
```

**각 TOP 5 아이템 카드** (JSX line 696-729):
```
- bg-quiz-card, 1위만 border-teal 나머지 border-quiz-border, rounded-[14px]
- 순위 + 아이템명
- 추천 이유 (item.why) — 틸 배경 박스
- ✅ 딱 맞는 역량: 아이템 요구 4이상 & 사용자 4이상인 역량 태그
  - 초록 배경/보더, "[아이콘] [역량] (내 N ≥ 필요 N)"
- ⚠️ 보완하면 좋은 점: 아이템 요구 4이상 & 사용자 2이하인 역량 태그
  - 금색 배경/보더, "[아이콘] [역량] (내 N < 필요 N)"
```

### `src/components/result/CompetencyGap.tsx`

IMPLEMENTATION_PLAN에서 정의한 바 차트 (JSX에는 없는 새 컴포넌트):

```
Recharts 수평 바 차트:
- Y축: 역량명 (12개)
- X축: 점수 (1~5)
- 두 개 바: 사용자 점수 (틸), 아이템 요구 점수 (금색)
- 갭이 큰 역량(user < required ≥ 3)은 빨강 하이라이트
```

### `src/components/result/SupplementGuide.tsx`

competency-guide.json 데이터 연동:
```
- 부족한 역량(competencyGap)별로:
  - 역량명 + 정의
  - 보완 방법 (competency-guide.json의 활용 예시)
  - 점수 기준 설명
```

### `src/components/result/RiskWarning.tsx`

각 TOP 5 아이템의 리스크:
```
- 폐업률 (3년): 빨강 if > 25%
- 경쟁강도: (N/5) 바
- 계절성: 있/없 표시
- 진입장벽: (N/5) 바
```

### `src/components/result/ScoreBreakdown.tsx`

매칭 점수 분해 시각화:
```
각 TOP 5 아이템별:
- 가로 누적 바: 역량50% | 성향30% | 경력10% | 시장10%
- 각 영역 숫자 표시
- 총점 표시
```

---

## 검증 체크리스트

```
1. /result/[유효한sessionId] 접속 → 전체 렌더링
2. 탭 전환 동작 (데이터 재요청 없음)
3. 추천 탭:
   - 사용자 유형 배지 정확 (최고 역량 기준)
   - 1위 히어로 카드 + 2-5위 그리드
   - 레이더 차트 12축 라벨 한국어
   - 12역량 점수 바 정확
4. 분석근거 탭:
   - 각 아이템 추천 이유 표시
   - 강점/약점 태그 정확
   - GAP 차트 정확 (user vs required)
   - 리스크 경고 아이템별 표시
5. 모든 데이터가 실제 매칭 결과 기반 (하드코딩 없음)
6. 존재하지 않는 sessionId → 에러 페이지
```
