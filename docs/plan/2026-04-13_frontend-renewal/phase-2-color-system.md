# Phase 2: 컬러 시스템 정리

- 예상 소요: 45분
- 수정 파일: 14개
- 커밋: 단일

## 목표

- 보라/핑크 계열 의존 제거
- 결과/차트/상태 색상을 토큰화
- rgba 하드코딩을 공용 토큰으로 정리

## 작업 순서

### 1. `tailwind.config.ts`

- `colors.quiz`에 아래 토큰 추가

```ts
'teal-subtle': 'rgba(20, 184, 166, 0.08)',
'teal-border': 'rgba(13, 148, 136, 0.25)',
'gold-subtle': 'rgba(245, 158, 11, 0.08)',
'gold-border': 'rgba(245, 158, 11, 0.25)',
'green-subtle': 'rgba(16, 185, 129, 0.1)',
'green-border': 'rgba(16, 185, 129, 0.28)',
red: '#EF4444',
'red-subtle': 'rgba(239, 68, 68, 0.06)',
'red-border': 'rgba(239, 68, 68, 0.25)',
```

- 아래 토큰 제거

```diff
- purple: '#8B5CF6',
- pink: '#EC4899',
```

- step 그라디언트 수정

```diff
- 'step-1-gradient': 'linear-gradient(90deg, #F59E0B, #EC4899)',
+ 'step-1-gradient': 'linear-gradient(90deg, #F59E0B, #FCD34D)',
- 'step-2-gradient': 'linear-gradient(90deg, #0D9488, #8B5CF6)',
+ 'step-2-gradient': 'linear-gradient(90deg, #0D9488, #14B8A6)',
- 'step-3-gradient': 'linear-gradient(90deg, #8B5CF6, #EC4899)'
+ 'step-3-gradient': 'linear-gradient(90deg, #14B8A6, #FCD34D)'
```

- `pulseSlow` 애니메이션 제거

### 2. `src/lib/chart-colors.ts` 신규 생성

```ts
export const CHART_COLORS = {
  primary: '#14B8A6',
  secondary: '#F59E0B',
  tertiary: '#10B981',
  quaternary: '#FCD34D',
  danger: '#EF4444',
  muted: '#1E293B',
  grid: '#1E293B',
  tickText: '#94A3B8',
  tickDim: '#64748B',
} as const;
```

### 3. 버튼/선택 UI 색상 치환

- `src/components/ui/Button.tsx`
  - `gold` variant의 `to-quiz-pink` 제거
- `src/components/diagnose/BinaryChoice.tsx`
  - `hover:border-quiz-purple` 제거

### 4. 결과 페이지 핵심 토큰 전환

- `src/components/result/ResultPageClient.tsx`
  - `future` 탭 색상 `#8B5CF6` → `#14B8A6`
  - 상단 SectionCard 배경을 토큰 기반으로 변경
  - 탭 비활성 스타일은 class 기반으로 정리
- `src/components/result/Top5Cards.tsx`
  - 틸/레드 rgba 하드코딩 제거
- `src/components/result/DiagnosisSummary.tsx`
  - `border/bg`를 `quiz-teal-*` 토큰으로 변경
- `src/components/result/WhyRecommended.tsx`
  - 골드/틸/그린 태그 배경 토큰화

### 5. 차트 색상 공용화

- `src/components/result/ScoreBreakdown.tsx`
- `src/components/result/RadarChart.tsx`
- `src/components/result/CompetencyGap.tsx`
- `src/components/result/StartupGuide.tsx`

모두 `CHART_COLORS`를 import해서 hex 하드코딩 제거

### 6. 잔여 퍼플 제거

- `src/components/result/FutureVision.tsx`
- `src/app/diagnose/loading/page.tsx`
- `src/app/diagnose/step-3/page.tsx`
- `src/components/result/RiskWarning.tsx`

## 완료 체크

- `rg -n "quiz-purple|quiz-pink|#8B5CF6|#EC4899" src tailwind.config.ts`
- 결과가 0건인지 확인
- 차트/결과 카드 색상 회귀 없는지 확인
