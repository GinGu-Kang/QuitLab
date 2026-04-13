# 프론트엔드 디자인 리뉴얼 구현 계획

> 작성일: 2026-04-13
> 리서치: docs/research/2026-04-13_frontend-renewal.md
> 복잡도: 대규모 (30+ 파일 수정)
> 전략: 7개 하위 Phase, 각각 별도 커밋
> **원칙: 알고리즘/로직 변경 절대 금지. className, style, 토큰 등 순수 디자인만 수정**

## 분할 실행 문서

- 인덱스: [2026-04-13_frontend-renewal/README.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/README.md)
- Phase 1: [phase-1-landing-redesign.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-1-landing-redesign.md)
- Phase 2: [phase-2-color-system.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-2-color-system.md)
- Phase 3: [phase-3-radius-unification.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-3-radius-unification.md)
- Phase 4: [phase-4-diagnose-step-design.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-4-diagnose-step-design.md)
- Phase 5: [phase-5-results-page-design.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-5-results-page-design.md)
- Phase 6: [phase-6-responsive.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-6-responsive.md)
- Phase 7: [phase-7-accessibility.md](/Users/gangjingu/project/Quit-codex/docs/plan/2026-04-13_frontend-renewal/phase-7-accessibility.md)

---

## Phase 1: 랜딩 페이지 리디자인 ✅ 완료

> 완료일: 2026-04-13 | 커밋: 8610969

**수정 파일 (4개)**
- `src/app/page.tsx` — 전면 개편 (피처 카드 그리드 → 히어로 중심 구성)
- `src/app/globals.css` — 배경 그라디언트 수정, fade-up 애니메이션 추가
- `src/components/ui/Button.tsx` — 퍼플 그라디언트 → 솔리드 틸, radius 통일
- `src/components/ui/SectionCard.tsx` — radius 통일

---

## Phase 2: 컬러 시스템 정리

> 예상 소요: 45분 | 수정 파일: 14개 | 커밋: 단일

### 2-1. tailwind.config.ts — 토큰 추가 + 데드코드 제거

**추가할 컬러 토큰 (colors.quiz 안에):**
```ts
// 투명 변형 (카드 배경/보더용)
'teal-subtle': 'rgba(20, 184, 166, 0.08)',
'teal-border': 'rgba(13, 148, 136, 0.25)',
'gold-subtle': 'rgba(245, 158, 11, 0.08)',
'gold-border': 'rgba(245, 158, 11, 0.25)',
'green-subtle': 'rgba(16, 185, 129, 0.1)',
'green-border': 'rgba(16, 185, 129, 0.28)',
// 위험/경고
red: '#EF4444',
'red-subtle': 'rgba(239, 68, 68, 0.06)',
'red-border': 'rgba(239, 68, 68, 0.25)',
```

**제거할 토큰:**
```diff
- purple: '#8B5CF6',
- pink: '#EC4899',
```

**그라디언트 수정:**
```diff
- 'step-1-gradient': 'linear-gradient(90deg, #F59E0B, #EC4899)',
+ 'step-1-gradient': 'linear-gradient(90deg, #F59E0B, #FCD34D)',
- 'step-2-gradient': 'linear-gradient(90deg, #0D9488, #8B5CF6)',
+ 'step-2-gradient': 'linear-gradient(90deg, #0D9488, #14B8A6)',
- 'step-3-gradient': 'linear-gradient(90deg, #8B5CF6, #EC4899)'
+ 'step-3-gradient': 'linear-gradient(90deg, #14B8A6, #FCD34D)'
```

**애니메이션 제거:**
```diff
  animation: {
    spin: 'spin 1s linear infinite',
-   pulseSlow: 'pulse 2.5s ease-in-out infinite'
  }
```

### 2-2. src/lib/chart-colors.ts — 신규 생성

```ts
/** 차트 전용 컬러 상수. tailwind.config.ts 토큰과 동기화. */
export const CHART_COLORS = {
  primary: '#14B8A6',     // quiz-teal-light
  secondary: '#F59E0B',   // quiz-gold
  tertiary: '#10B981',    // quiz-green
  quaternary: '#FCD34D',  // quiz-gold-light
  danger: '#EF4444',      // quiz-red
  muted: '#1E293B',       // quiz-border
  grid: '#1E293B',        // 차트 그리드
  tickText: '#94A3B8',    // 축 라벨
  tickDim: '#64748B',     // 축 보조
} as const;
```

### 2-3. src/components/ui/Button.tsx:24 — gold variant 핑크 제거

```diff
- variant === 'gold' && 'bg-gradient-to-br from-quiz-gold to-quiz-pink text-quiz-bg shadow-gold',
+ variant === 'gold' && 'bg-gradient-to-br from-quiz-gold to-quiz-gold-light text-quiz-bg shadow-gold',
```

### 2-4. src/components/diagnose/BinaryChoice.tsx:19 — 퍼플 호버 제거

```diff
- 'hover:-translate-y-1 hover:border-quiz-purple hover:bg-quiz-hover'
+ 'hover:-translate-y-1 hover:border-quiz-teal hover:bg-quiz-hover'
```

### 2-5. src/components/result/ResultPageClient.tsx — 탭 컬러 + 인라인 스타일

**라인 26-31: 탭 배열에서 퍼플 제거**
```diff
  const tabs: { key: ResultTabKey; label: string; color: string }[] = [
    { key: 'match', label: '🏆 추천', color: '#0D9488' },
    { key: 'why', label: '💡 분석근거', color: '#F59E0B' },
    { key: 'guide', label: '📋 가이드', color: '#10B981' },
-   { key: 'future', label: '✨ 미래상상', color: '#8B5CF6' }
+   { key: 'future', label: '✨ 미래상상', color: '#14B8A6' }
  ];
```

**라인 92: SectionCard 인라인 그라디언트 → 토큰화**
```diff
- <SectionCard className="overflow-hidden bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(17,24,39,0.98),rgba(245,158,11,0.06))]">
+ <SectionCard className="overflow-hidden bg-[linear-gradient(135deg,theme(colors.quiz.teal-subtle),rgba(17,24,39,0.98),theme(colors.quiz.gold-subtle))]">
```
> 참고: tailwind의 theme() 함수로 rgba 토큰 참조. 빌드 시 실제 값으로 치환됨.
> 만약 theme() 참조 안 되면 `bg-gradient-to-br from-quiz-teal-subtle via-quiz-card to-quiz-gold-subtle` 대안 사용.

**라인 117-119: 탭 인라인 style → 토큰 기반 유지**
> 탭 color는 동적이라 인라인 style 유지 불가피. 단, 하드코딩된 hex 제거:
```diff
  style={{
    borderColor: activeTab === tab.key ? tab.color : '#1E293B',
-   background: activeTab === tab.key ? `${tab.color}22` : '#111827',
-   color: activeTab === tab.key ? tab.color : '#64748B'
+   background: activeTab === tab.key ? `${tab.color}18` : undefined,
+   color: activeTab === tab.key ? tab.color : undefined
  }}
+ className={cn(
+   'flex-1 rounded-sm border px-3 py-2 text-[12px] font-semibold',
+   activeTab !== tab.key && 'border-quiz-border bg-quiz-card text-quiz-text-dim'
+ )}
```

### 2-6. src/components/result/Top5Cards.tsx — 레드 토큰 전환

**라인 9: 틸 투명 → 토큰**
```diff
- <div className="relative rounded-[20px] border-2 border-quiz-teal bg-[rgba(13,148,136,0.08)] p-5">
+ <div className="relative rounded-[20px] border-2 border-quiz-teal bg-quiz-teal-subtle p-5">
```

**라인 20-22: 레드 하드코딩 → 토큰**
```diff
- <div className="rounded-[18px] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] p-4">
-   <p className="text-[11px] font-bold text-red-400">⚠️ 알고 시작하세요</p>
-   <p className="mt-2 text-xs leading-6 text-red-100/80">
+ <div className="rounded-[18px] border border-quiz-red-border bg-quiz-red-subtle p-4">
+   <p className="text-[11px] font-bold text-quiz-red">⚠️ 알고 시작하세요</p>
+   <p className="mt-2 text-xs leading-6 text-quiz-text-secondary">
```

### 2-7. src/components/result/DiagnosisSummary.tsx:7 — 투명 → 토큰

```diff
- <div className="rounded-[22px] border border-[rgba(13,148,136,0.25)] bg-[rgba(13,148,136,0.08)] p-5">
+ <div className="rounded-[22px] border border-quiz-teal-border bg-quiz-teal-subtle p-5">
```

### 2-8. src/components/result/WhyRecommended.tsx — rgba 4곳 토큰 전환

**라인 24: 골드 투명**
```diff
- <div className="rounded-[20px] border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.08)] p-5">
+ <div className="rounded-[20px] border border-quiz-gold-border bg-quiz-gold-subtle p-5">
```

**라인 45: 틸 투명**
```diff
- <div className="mt-4 rounded-[14px] bg-[rgba(13,148,136,0.08)] p-4 text-sm leading-7 text-quiz-text-secondary">
+ <div className="mt-4 rounded-[14px] bg-quiz-teal-subtle p-4 text-sm leading-7 text-quiz-text-secondary">
```

**라인 52: 그린 태그**
```diff
- <span ... className="rounded-full border border-[rgba(16,185,129,0.28)] bg-[rgba(16,185,129,0.1)] px-3 py-1 text-xs text-green-200">
+ <span ... className="rounded-full border border-quiz-green-border bg-quiz-green-subtle px-3 py-1 text-xs text-quiz-green">
```

**라인 63: 골드 태그**
```diff
- <span ... className="rounded-full border border-[rgba(245,158,11,0.28)] bg-[rgba(245,158,11,0.1)] px-3 py-1 text-xs text-yellow-200">
+ <span ... className="rounded-full border border-quiz-gold-border bg-quiz-gold-subtle px-3 py-1 text-xs text-quiz-gold-light">
```

### 2-9. src/components/result/ScoreBreakdown.tsx:3-8 — 차트 컬러 상수화

```diff
+ import { CHART_COLORS } from '@/lib/chart-colors';
+
  const segments = [
-   { key: 'competencyFit', label: '역량 50%', color: '#14B8A6' },
-   { key: 'personalityFit', label: '성향 30%', color: '#F59E0B' },
-   { key: 'careerSynergy', label: '경력 10%', color: '#8B5CF6' },
-   { key: 'marketAttractiveness', label: '시장 10%', color: '#EC4899' }
+   { key: 'competencyFit', label: '역량 50%', color: CHART_COLORS.primary },
+   { key: 'personalityFit', label: '성향 30%', color: CHART_COLORS.secondary },
+   { key: 'careerSynergy', label: '경력 10%', color: CHART_COLORS.tertiary },
+   { key: 'marketAttractiveness', label: '시장 10%', color: CHART_COLORS.quaternary }
  ] as const;
```

### 2-10. src/components/result/RadarChart.tsx — 차트 컬러 상수화

**라인 28-32: PolarGrid, Radar 컬러**
```diff
+ import { CHART_COLORS } from '@/lib/chart-colors';
  ...
- <PolarGrid stroke="#1E293B" />
- <PolarAngleAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 10 }} />
- <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#64748B', fontSize: 9 }} />
- <Radar dataKey="user" stroke="#14B8A6" fill="rgba(20, 184, 166, 0.22)" />
- <Radar dataKey="required" stroke="#F59E0B" fill="rgba(245, 158, 11, 0.12)" />
+ <PolarGrid stroke={CHART_COLORS.grid} />
+ <PolarAngleAxis dataKey="label" tick={{ fill: CHART_COLORS.tickText, fontSize: 10 }} />
+ <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: CHART_COLORS.tickDim, fontSize: 9 }} />
+ <Radar dataKey="user" stroke={CHART_COLORS.primary} fill="rgba(20, 184, 166, 0.22)" />
+ <Radar dataKey="required" stroke={CHART_COLORS.secondary} fill="rgba(245, 158, 11, 0.12)" />
```

**라인 46: 점수 색상 퍼플 대신 레드→골드→틸**
```diff
- const color = entry.user >= 4 ? '#14B8A6' : entry.user >= 3 ? '#F59E0B' : '#EF4444';
+ const color = entry.user >= 4 ? CHART_COLORS.primary : entry.user >= 3 ? CHART_COLORS.secondary : CHART_COLORS.danger;
```

**라인 51: 빈 점수 배경**
```diff
- style={{ background: filled ? color : '#1E293B' }}
+ style={{ background: filled ? color : CHART_COLORS.muted }}
```

### 2-11. src/components/result/CompetencyGap.tsx — 차트 컬러 상수화

**라인 28-33:**
```diff
+ import { CHART_COLORS } from '@/lib/chart-colors';
  ...
- <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
- <XAxis type="number" domain={[0, 5]} tick={{ fill: '#94A3B8' }} />
- <YAxis type="category" dataKey="name" width={72} tick={{ fill: '#94A3B8', fontSize: 11 }} />
+ <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
+ <XAxis type="number" domain={[0, 5]} tick={{ fill: CHART_COLORS.tickText }} />
+ <YAxis type="category" dataKey="name" width={72} tick={{ fill: CHART_COLORS.tickText, fontSize: 11 }} />
  <Tooltip />
- <Bar dataKey="user" fill="#14B8A6" radius={[0, 6, 6, 0]} />
- <Bar dataKey="required" fill="#F59E0B" radius={[0, 6, 6, 0]} />
+ <Bar dataKey="user" fill={CHART_COLORS.primary} radius={[0, 6, 6, 0]} />
+ <Bar dataKey="required" fill={CHART_COLORS.secondary} radius={[0, 6, 6, 0]} />
```

### 2-12. src/components/result/RiskWarning.tsx — 레드 토큰

**라인 19:**
```diff
- <p className="mt-1 text-sm font-semibold text-red-300">{result.item.closureRate}</p>
+ <p className="mt-1 text-sm font-semibold text-quiz-red">{result.item.closureRate}</p>
```

**라인 34:**
```diff
- <div className="h-full rounded-full bg-red-400" style={{ width: `${(result.item.competitionLevel / 5) * 100}%` }} />
+ <div className="h-full rounded-full bg-quiz-red" style={{ width: `${(result.item.competitionLevel / 5) * 100}%` }} />
```

### 2-13. src/components/result/StartupGuide.tsx:7-12 — 퍼플/핑크 제거

```diff
+ import { CHART_COLORS } from '@/lib/chart-colors';
+
  const costStructure = [
-   { label: '임대/시설', width: '42%', color: '#14B8A6' },
-   { label: '인테리어/장비', width: '30%', color: '#8B5CF6' },
-   { label: '운영자금', width: '18%', color: '#F59E0B' },
-   { label: '마케팅/인허가', width: '10%', color: '#EC4899' }
+   { label: '임대/시설', width: '42%', color: CHART_COLORS.primary },
+   { label: '인테리어/장비', width: '30%', color: CHART_COLORS.secondary },
+   { label: '운영자금', width: '18%', color: CHART_COLORS.tertiary },
+   { label: '마케팅/인허가', width: '10%', color: CHART_COLORS.quaternary }
  ];
```

**라인 54: 핑크 텍스트 제거**
```diff
- <p className="text-xs font-semibold text-quiz-pink">💰 비용 구조</p>
+ <p className="text-xs font-semibold text-quiz-gold-light">💰 비용 구조</p>
```

### 2-14. src/components/result/FutureVision.tsx — 퍼플 전면 제거

**라인 8-9: 보더/배경**
```diff
- <div className="rounded-[20px] border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.08)] p-5">
-   <p className="text-sm leading-7 text-purple-100">💭 진지한 분석은 위 탭에서 다 봤죠? 여기서는 잠깐 상상해봐요.</p>
+ <div className="rounded-[20px] border border-quiz-teal-border bg-quiz-teal-subtle p-5">
+   <p className="text-sm leading-7 text-quiz-text-secondary">💭 진지한 분석은 위 탭에서 다 봤죠? 여기서는 잠깐 상상해봐요.</p>
```

**라인 12: 3색 그라디언트 → 2색**
```diff
- <div className="rounded-[24px] border border-quiz-border bg-gradient-to-br from-[rgba(13,148,136,0.18)] via-[rgba(139,92,246,0.18)] to-[rgba(236,72,153,0.14)] p-6">
+ <div className="rounded-[24px] border border-quiz-border bg-gradient-to-br from-quiz-teal-subtle to-quiz-gold-subtle p-6">
```

**라인 15: 아바타 그라디언트**
```diff
- <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-quiz-teal to-quiz-purple text-2xl font-bold">
+ <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-quiz-teal to-quiz-gold text-2xl font-bold">
```

### 2-15. src/app/diagnose/loading/page.tsx:86 — 틸 투명 토큰화

```diff
- className={`rounded-full px-4 py-2 text-sm ${index <= stepIndex ? 'bg-[rgba(20,184,166,0.14)] text-quiz-teal-light' : 'bg-quiz-card text-quiz-text-dim'}`}
+ className={`rounded-full px-4 py-2 text-sm ${index <= stepIndex ? 'bg-quiz-teal-subtle text-quiz-teal-light' : 'bg-quiz-card text-quiz-text-dim'}`}
```

### 2-16. src/app/diagnose/step-3/page.tsx:89 — 퍼플 투명 제거

```diff
- <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(139,92,246,0.14)] text-3xl">✨</div>
+ <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-quiz-teal-subtle text-3xl">✨</div>
```

---

## Phase 3: Border-Radius 통일

> 예상 소요: 30분 | 수정 파일: 20개 | 커밋: 단일

### 매핑 규칙
| 현재 값 | 변경 | 용도 |
|---------|------|------|
| `rounded-[12px]`, `rounded-[14px]` | `rounded-sm` (8px) | 입력, 버튼 내부, 태그, 소형 카드 |
| `rounded-[16px]`, `rounded-[18px]` | `rounded-md` (12px) | 카드, 섹션, 탭 패널 |
| `rounded-[20px]`, `rounded-[22px]`, `rounded-[24px]` | `rounded-lg` (16px) | 대형 컨테이너, 페이지 래퍼 |
| `rounded-full` | 유지 | 원형 (닷, 뱃지, 프로그레스) |
| `rounded-xl` | 유지 | ScoreBreakdown 기존 사용 |

### 파일별 변경 명세

**src/components/ui/Input.tsx:13**
```diff
- 'min-h-11 w-full rounded-[14px] border border-quiz-border bg-quiz-card px-4 py-3 text-[15px] text-quiz-text',
+ 'min-h-11 w-full rounded-sm border border-quiz-border bg-quiz-card px-4 py-3 text-[15px] text-quiz-text',
```

**src/components/diagnose/QuestionCard.tsx:17**
```diff
- <div className={cn('rounded-[22px] border border-quiz-border bg-quiz-card/95 p-5 shadow-[0_24px_80px_rgba(3,7,18,0.32)]', className)}>
+ <div className={cn('rounded-lg border border-quiz-border bg-quiz-card/95 p-5 shadow-[0_24px_80px_rgba(3,7,18,0.32)]', className)}>
```

**src/components/diagnose/OptionButton.tsx:21**
```diff
- 'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[14px] border bg-quiz-card px-4 py-3.5 text-left',
+ 'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-sm border bg-quiz-card px-4 py-3.5 text-left',
```

**src/components/diagnose/BinaryChoice.tsx:18**
```diff
- 'flex min-h-40 cursor-pointer flex-col justify-between rounded-[18px] border border-quiz-border bg-quiz-card p-5 text-left',
+ 'flex min-h-40 cursor-pointer flex-col justify-between rounded-md border border-quiz-border bg-quiz-card p-5 text-left',
```

**src/components/result/ResultPageClient.tsx**
- 라인 109: `rounded-[20px]` → `rounded-lg`
- 라인 115: `rounded-[12px]` → `rounded-sm`
- 라인 135: `rounded-[16px]` → `rounded-md`
- 라인 139: `rounded-[16px]` → `rounded-md`
- 라인 145: `rounded-[16px]` → `rounded-md`

**src/components/result/Top5Cards.tsx**
- 라인 9: `rounded-[20px]` → `rounded-lg`
- 라인 20: `rounded-[18px]` → `rounded-md`
- 라인 29: `rounded-[14px]` → `rounded-sm`

**src/components/result/DiagnosisSummary.tsx:7**
- `rounded-[22px]` → `rounded-lg`

**src/components/result/ScoreBreakdown.tsx:23**
- `rounded-[18px]` → `rounded-md`

**src/components/result/RadarChart.tsx:24**
- `rounded-[22px]` → `rounded-lg`

**src/components/result/CompetencyGap.tsx**
- 라인 16: `rounded-[20px]` → `rounded-lg`
- 라인 23: `rounded-[20px]` → `rounded-lg`

**src/components/result/WhyRecommended.tsx**
- 라인 24: `rounded-[20px]` → `rounded-lg`
- 라인 35: `rounded-[18px]` → `rounded-md`
- 라인 45: `rounded-[14px]` → `rounded-sm`

**src/components/result/SupplementGuide.tsx**
- 라인 14: `rounded-[18px]` → `rounded-md`
- 라인 23: `rounded-[18px]` → `rounded-md`

**src/components/result/RiskWarning.tsx**
- 라인 7: `rounded-[18px]` → `rounded-md`
- 라인 17: `rounded-[14px]` → `rounded-sm`
- 라인 21: `rounded-[14px]` → `rounded-sm`

**src/components/result/ChecklistCard.tsx:14**
- `rounded-[18px]` → `rounded-md`

**src/components/result/StartupGuide.tsx:24**
- `rounded-[18px]` → `rounded-md`
- 라인 43, 48, 53: `rounded-[14px]` → `rounded-sm`

**src/components/result/FutureVision.tsx**
- 라인 8: `rounded-[20px]` → `rounded-lg`
- 라인 12: `rounded-[24px]` → `rounded-lg`
- 라인 25: `rounded-[18px]` → `rounded-md`

**src/components/result/GovernmentSupport.tsx:10**
- `rounded-[18px]` → `rounded-md`

**src/components/result/Roadmap.tsx**
- 라인 12: `rounded-[18px]` → `rounded-md`
- 라인 22: `rounded-[16px]` → `rounded-md`

**src/components/result/EmailCollector.tsx:49**
- `rounded-[18px]` → `rounded-md`

**src/components/result/ShareButtons.tsx:22**
- `rounded-[18px]` → `rounded-md`

**src/components/ad/AdPageClient.tsx**
- 라인 38: `rounded-[22px]` → `rounded-lg`
- 라인 40: `rounded-[20px]` → `rounded-lg`
- 라인 41: `rounded-[18px]` → `rounded-md`

**src/components/AdBanner.tsx**
- 라인 4: `rounded-[22px]` → `rounded-lg`
- 라인 11: `rounded-[22px]` → `rounded-lg`

**src/app/diagnose/step-3/page.tsx:88**
- `rounded-[22px]` → `rounded-lg`

---

## Phase 4: 진단 스텝 페이지 디자인 개선

> 예상 소요: 1시간 | 수정 파일: 6개 | 커밋: 단일

### 4-1. src/app/diagnose/step-1/page.tsx — 페이지 진입 애니메이션

**라인 51: main 태그에 fade-up 추가**
```diff
- <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
+ <main className="animate-fade-up mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
```

### 4-2. src/app/diagnose/step-2/page.tsx — 페이지 진입 애니메이션

**라인 53:**
```diff
- <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
+ <main className="animate-fade-up mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
```

### 4-3. src/app/diagnose/step-3/page.tsx — 페이지 진입 + 완료 화면

**라인 54:**
```diff
- <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
+ <main className="animate-fade-up mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
```

### 4-4. src/app/diagnose/loading/page.tsx — 스텝 리스트 개선

**라인 76:**
```diff
- <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center px-4 text-center">
+ <main className="animate-fade-up mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center px-4 text-center">
```

### 4-5. src/components/diagnose/QuestionCard.tsx — 그림자 rgba 정리

**라인 17: 이미 `shadow-[0_24px_80px_rgba(3,7,18,0.32)]` 사용 중. 이 값은 배경색 기반 그림자이므로 유지.**

변경 없음 (그림자는 배경색 어둡게한 자연스러운 값).

### 4-6. src/components/diagnose/OptionButton.tsx — 선택 상태 시각 피드백

현재 `selected` prop이 있지만 step-2에서 전달하지 않음. 여기서는 **디자인만** 다듬음:

**라인 22: 호버 시 이동 방향 (→ 대신 살짝 위로)**
```diff
- 'hover:translate-x-1 hover:border-quiz-teal hover:bg-quiz-hover',
+ 'hover:-translate-y-0.5 hover:border-quiz-teal hover:bg-quiz-hover',
```
> 이유: translate-x는 레이아웃 밀림 유발. translate-y가 카드 리프트로 더 자연스러움.

---

## Phase 5: 결과 페이지 디자인 개선

> 예상 소요: 30분 | 수정 파일: 2개 | 커밋: 단일
> 참고: 컬러/radius 변경은 Phase 2, 3에서 이미 처리됨. 여기는 추가 개선만.

### 5-1. src/components/result/ResultPageClient.tsx — 탭 접근성 + 스타일

**라인 109-124: 탭 컨테이너에 role 추가, 각 탭에 aria-selected 추가**
```diff
- <div className="grid gap-2 rounded-[20px] border border-quiz-border bg-quiz-card p-2 sm:grid-cols-4">
+ <div role="tablist" className="grid gap-2 rounded-lg border border-quiz-border bg-quiz-card p-2 sm:grid-cols-4">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
+       role="tab"
+       aria-selected={activeTab === tab.key}
        onClick={() => setActiveTab(tab.key)}
```

### 5-2. src/components/result/StartupGuide.tsx:54 — quiz-pink 참조 제거

이미 Phase 2-13에서 처리됨. 추가 변경 없음.

---

## Phase 6: 반응형 개선

> 예상 소요: 45분 | 수정 파일: 5개 | 커밋: 단일

### 6-1. src/components/result/ResultPageClient.tsx — 탭 모바일 2열

**라인 109:**
```diff
- <div ... className="grid gap-2 ... sm:grid-cols-4">
+ <div ... className="grid grid-cols-2 gap-2 ... sm:grid-cols-4">
```

### 6-2. src/components/result/RadarChart.tsx:25 — 차트 높이 모바일 조정

```diff
- <div className="h-[280px] w-full">
+ <div className="h-[220px] w-full sm:h-[280px]">
```

### 6-3. src/components/result/CompetencyGap.tsx:25 — 차트 높이 모바일 조정

```diff
- <div className="h-[320px]">
+ <div className="h-[260px] sm:h-[320px]">
```

### 6-4. src/components/result/Roadmap.tsx — 모바일 세로 스택

**라인 14-15: 모바일에서 세로 배치, sm 이상에서 가로**
```diff
- <div className="mt-5 overflow-x-auto">
-   <div className="flex min-w-[720px] items-start gap-4">
+ <div className="mt-5 sm:overflow-x-auto">
+   <div className="flex flex-col gap-4 sm:min-w-[720px] sm:flex-row sm:items-start">
```

**라인 19: 커넥터 모바일에서 숨김**
```diff
- {index < roadmap.length - 1 ? (
-   <div className="absolute left-[calc(100%_-_8px)] top-4 h-[2px] w-8 bg-gradient-to-r from-quiz-teal to-quiz-gold" />
- ) : null}
+ {index < roadmap.length - 1 ? (
+   <div className="absolute left-[calc(100%_-_8px)] top-4 hidden h-[2px] w-8 bg-gradient-to-r from-quiz-teal to-quiz-gold sm:block" />
+ ) : null}
```

### 6-5. src/components/result/ResultPageClient.tsx:96 — 결과 제목 모바일

```diff
- <h1 className="mt-2 text-[30px] font-extrabold leading-tight sm:text-[38px]">
+ <h1 className="mt-2 text-[24px] font-extrabold leading-tight sm:text-[30px] lg:text-[38px]">
```

---

## Phase 7: 접근성 & 마이크로카피

> 예상 소요: 30분 | 수정 파일: 4개 | 커밋: 단일

### 7-1. src/components/ui/ProgressBar.tsx — aria 속성

**라인 11-12: 외부 div에 progressbar role**
```diff
- <div className={cn('mb-4 flex gap-[3px]', className)}>
+ <div role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total} aria-label="진행률" className={cn('mb-4 flex gap-[3px]', className)}>
```

### 7-2. src/app/diagnose/loading/page.tsx — aria-live

**라인 81: 현재 스텝 텍스트에 aria-live**
```diff
- <p className="mt-3 max-w-md text-sm leading-7 text-quiz-text-secondary">{steps[stepIndex]}</p>
+ <p aria-live="polite" className="mt-3 max-w-md text-sm leading-7 text-quiz-text-secondary">{steps[stepIndex]}</p>
```

### 7-3. src/app/layout.tsx — skip-to-main

**body 태그 직후에 추가:**
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-quiz-teal focus:px-4 focus:py-2 focus:text-white">
  본문으로 건너뛰기
</a>
```
> 각 페이지의 `<main>` 태그에 `id="main-content"` 추가 필요.

### 7-4. tailwind.config.ts — 컬러 대비 개선

```diff
- 'text-dim': '#64748B'
+ 'text-dim': '#7C8BA1'
```
> WCAG AA 기준: #64748B on #111827 = 3.73:1 (미달) → #7C8BA1 on #111827 = 4.6:1 (충족)

---

## 실행 일정

| Phase | 작업 | 예상일 | 소요시간 | 수정 파일 수 | 커밋 |
|-------|------|--------|----------|-------------|------|
| 1 | 랜딩 리디자인 | ✅ 04-13 | 완료 | 4 | 8610969 |
| 2 | 컬러 시스템 정리 | 04-13 | 45분 | 14 | 단일 |
| 3 | Border-Radius 통일 | 04-14 | 30분 | 20 | 단일 |
| 4 | 진단 스텝 디자인 | 04-14 | 1시간 | 6 | 단일 |
| 5 | 결과 페이지 탭 개선 | 04-15 | 30분 | 2 | 단일 |
| 6 | 반응형 개선 | 04-15 | 45분 | 5 | 단일 |
| 7 | 접근성 & 대비 | 04-16 | 30분 | 4 | 단일 |

**총 예상 소요: ~4.5시간 (Phase 1 제외)**

---

## 검증 체크리스트

각 Phase 완료 후:
- [ ] `npm run build` 에러 없음
- [ ] `npm run dev` 해당 페이지 정상 렌더링
- [ ] 모바일 뷰포트 (375px) 레이아웃 깨짐 없음
- [ ] 이전 Phase 변경사항 회귀 없음

최종 완료 후:
- [ ] 전체 플로우 E2E: 랜딩 → step-1 → step-2 → step-3 → loading → ad → result
- [ ] `grep -r "quiz-purple\|quiz-pink\|#8B5CF6\|#EC4899" src/` 결과 0건
- [ ] WCAG AA 컬러 대비 검증 (quiz-text-dim ≥ 4.5:1)
- [ ] Lighthouse 접근성 점수 ≥ 90

---

## 변경하지 않는 것 (명시적 제외)

아래 파일/영역은 이 리뉴얼에서 **절대 수정하지 않음**:

- `src/lib/matching.ts` — 매칭 알고리즘
- `src/lib/analytics.ts` — 이벤트 트래킹
- `src/store/diagnose-store.ts` — 상태 관리 로직
- `src/app/api/**` — API 라우트
- `prisma/` — DB 스키마
- `scripts/` — 시드 스크립트
- `src/types/` — 타입 정의
- 모든 컴포넌트의 props 인터페이스, 데이터 흐름, 이벤트 핸들러 로직
- `buildStrengthTags`, `buildWeaknessTags` 등 데이터 가공 함수
- `useDiagnoseStore` 호출부 (reset, setHardFilter 등)
- `fetch`, `router.push`, `recordEvent` 등 사이드이펙트
