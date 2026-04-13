# Phase 4: 퀴즈 플로우 UI (랜딩 → 3단계 퀴즈 → 로딩 → 광고)

> **사전 조건**: Phase 1 (데이터, Tailwind), Phase 2 (API)
> **산출물**: 전체 퀴즈 플로우 완주 가능한 UI
> **예상 파일 수**: ~20-25개

---

## 4-1. Zustand 스토어

### 파일: `src/store/diagnose-store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DiagnoseState {
  // Step 1: Hard Filter (8개)
  hardFilter: Record<string, string | number | boolean>;
  setHardFilter: (key: string, value: string | number | boolean) => void;

  // Step 2: Competency (24문항)
  competencyAnswers: (number | null)[];  // length 24, 각 값 1~5
  setCompetencyAnswer: (index: number, score: number) => void;

  // Step 3: Personality (10문항)
  personalityAnswers: ('a' | 'b' | null)[];  // length 10
  setPersonalityAnswer: (index: number, choice: 'a' | 'b') => void;

  // 닉네임
  name: string;
  setName: (name: string) => void;

  // 네비게이션
  currentStep: number;       // 1, 2, 3
  currentQuestionIndex: number;
  setCurrentStep: (step: number) => void;
  nextQuestion: () => void;

  // Computed: 24문항 → 12역량 평균 (동일 역량 2문항의 평균)
  getCompetencyScores: () => number[];

  // 리셋
  reset: () => void;
}

export const useDiagnoseStore = create<DiagnoseState>()(
  persist(
    (set, get) => ({
      hardFilter: {},
      setHardFilter: (key, value) =>
        set(s => ({ hardFilter: { ...s.hardFilter, [key]: value } })),

      competencyAnswers: Array(24).fill(null),
      setCompetencyAnswer: (index, score) =>
        set(s => {
          const arr = [...s.competencyAnswers];
          arr[index] = score;
          return { competencyAnswers: arr };
        }),

      personalityAnswers: Array(10).fill(null),
      setPersonalityAnswer: (index, choice) =>
        set(s => {
          const arr = [...s.personalityAnswers];
          arr[index] = choice;
          return { personalityAnswers: arr };
        }),

      name: '',
      setName: (name) => set({ name }),

      currentStep: 1,
      currentQuestionIndex: 0,
      setCurrentStep: (step) => set({ currentStep: step, currentQuestionIndex: 0 }),
      nextQuestion: () => set(s => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),

      getCompetencyScores: () => {
        // 24문항 → 12역량 (index 0,1 = 역량0, index 2,3 = 역량1, ...)
        const answers = get().competencyAnswers;
        return Array.from({ length: 12 }, (_, i) => {
          const q1 = answers[i * 2];
          const q2 = answers[i * 2 + 1];
          if (q1 != null && q2 != null) return (q1 + q2) / 2;
          if (q1 != null) return q1;
          if (q2 != null) return q2;
          return 3; // 기본값
        });
      },

      reset: () => set({
        hardFilter: {},
        competencyAnswers: Array(24).fill(null),
        personalityAnswers: Array(10).fill(null),
        name: '',
        currentStep: 1,
        currentQuestionIndex: 0,
      }),
    }),
    { name: 'diagnose-storage' }
  )
);
```

---

## 4-2. 공통 UI 컴포넌트

### `src/components/ui/Button.tsx`

JSX의 `Btn` 컴포넌트 → Tailwind 버전:
- **primary**: `bg-gradient-to-br from-quiz-teal to-quiz-purple shadow-[0_0_20px_rgba(13,148,136,0.25)]`
- **gold**: `bg-gradient-to-br from-quiz-gold to-quiz-pink shadow-[0_0_20px_rgba(245,158,11,0.25)]`
- **default**: `bg-quiz-card border border-quiz-border text-quiz-text-secondary`
- 공통: `border-none rounded-[14px] py-3.5 px-6 text-[15px] font-bold text-white cursor-pointer`
- `full` prop → `w-full`

### `src/components/ui/ProgressBar.tsx`

JSX에서 사용하는 진행바 패턴:
```tsx
// total: 총 문항 수, current: 현재 인덱스
<div className="flex gap-[3px] mb-3.5">
  {Array.from({ length: total }, (_, i) => (
    <div key={i} className="flex-1 h-1 rounded-sm"
      style={{
        background: i <= current
          ? gradient  // step별 다른 그래디언트
          : '#1E293B'
      }}
    />
  ))}
</div>
```

그래디언트 색상:
- Step 1 (하드필터): `linear-gradient(90deg, #F59E0B, #EC4899)` (금-핑크)
- Step 2 (역량): `linear-gradient(90deg, #0D9488, #8B5CF6)` (틸-퍼플)
- Step 3 (성향): `linear-gradient(90deg, #8B5CF6, #EC4899)` (퍼플-핑크)

### `src/components/diagnose/QuestionCard.tsx`

질문 표시 + 페이드 애니메이션:
```tsx
// JSX의 fade 전환: opacity 0→1, 200ms
// go = () => { setFade(false); setTimeout(() => { fn(); setFade(true); }, 200); }
```

Props: `stepLabel`, `question`, `children` (선택지)

### `src/components/diagnose/OptionButton.tsx`

JSX의 `OptBtn` → Tailwind:
```tsx
// hover 시: bg → quiz-hover, border → quiz-teal, translateX(4px)
// 기본: bg-quiz-card border-quiz-border rounded-[14px] p-3.5 text-sm
// flex items-center gap-2.5 w-full text-left
// icon: text-xl flex-shrink-0
```

### `src/components/diagnose/BinaryChoice.tsx`

성향 진단(Step 3)용 A/B 양자택일 컴포넌트:
- 2개의 큰 카드 (A, B)
- 각 카드: 아이콘 + 텍스트
- `OptBtn`과 유사하지만 더 큰 카드 형태

### `src/components/diagnose/HardFilterQuestion.tsx`

하드필터(Step 1)용 — 일부 질문은 옵션이 2개(대출), 일부는 5개(자본), 일부는 14개(직종):
- 직종 선택(career)은 2열 그리드
- 나머지는 세로 나열

---

## 4-3. 페이지 구현

### `src/app/page.tsx` — 랜딩

JSX의 `phase==="landing"` 참조 (line 527-537):
```
- 🏪 아이콘 (56px)
- 그래디언트 타이틀: "퇴사하면 나는 / 어떤 가게 사장님?"
  - background: linear-gradient(135deg, #14B8A6, #FCD34D)
  - WebkitBackgroundClip: text
- 서브텍스트: "12개 질문으로 찾는 나의 운명 자영업"
  - + 틸 컬러 "현실 비용 · 수익 · 창업가이드"
- CTA 버튼 (primary): "내 운명 가게 찾기 →"
- 하단: "⏱️ 3분 · 로그인 불필요"
- 중앙 정렬, flex column, justify-center, min-h-screen
- max-w-[480px] mx-auto
```

### `src/app/diagnose/step-1/page.tsx` — 하드필터 8문항

데이터 소스: `src/data/hard-filters.json` (또는 JSX의 PQS 배열 참조)

JSX의 `phase==="p"` 참조 (line 567-579):
```
- 진행바 (금-핑크 그래디언트)
- 라벨: "STEP 1 / 3 · 현실 조건 (n/8)"
- 질문 + 선택지 (OptionButton 사용)
- "건너뛰기 →" 링크
- 각 질문 응답 시 Zustand에 저장 + 다음 질문
- 8문항 완료 시 → /diagnose/step-2 이동
```

하드필터 질문 순서 (JSX PQS 배열):
1. capital (자본금, 5개 옵션)
2. loan (대출 의향, 2개 옵션)
3. timing (퇴사 시기, 4개 옵션)
4. family (가족 상황, 3개 옵션)
5. income (희망 월수입, 4개 옵션)
6. career (직전 직종, 14개 옵션 — 2열 그리드)
7. region (지역, 4개 옵션)
8. license (자격증, 5개 옵션)

### `src/app/diagnose/step-2/page.tsx` — 역량진단 24문항

데이터 소스: `src/data/competency-questions.json`

JSX의 `phase==="q"` 참조 (line 553-564):
```
- 진행바 (틸-퍼플 그래디언트)
- 라벨: "STEP 2 / 3 · 역량 진단 (n/24)"
- 질문(시나리오) + 5개 선택지
- 선택지는 점수 순 (5→1) 배열
- 각 응답 시 Zustand competencyAnswers[index] = score
- 24문항 완료 시 → /diagnose/step-3 이동
```

### `src/app/diagnose/step-3/page.tsx` — 성향진단 10문항

데이터 소스: `src/data/personality-questions.json`

JSX의 `phase==="pv"` 참조 (line 582-596):
```
- 진행바 (퍼플-핑크 그래디언트)
- 라벨: "STEP 3 / 3 · 성향·가치관 (n/10)"
- 보조 라벨: "'할 수 있느냐'가 아닌 '하고 싶은가'를 묻습니다" (퍼플)
- 질문 + A/B 두 개 선택지 (BinaryChoice 컴포넌트)
- "건너뛰기 →" 링크
- 10문항 완료 시 → 닉네임 입력 (인라인) → /diagnose/loading
```

### 닉네임 입력 (Step 3 완료 후)

JSX의 `phase==="name"` 참조 (line 540-550):
```
- ✨ 아이콘
- "모든 진단 완료!"
- 닉네임 입력 (input, maxLength 10)
- "분석 결과 보기 →" 버튼
- "건너뛰기" → 기본값 "도전자"
```

> 닉네임 입력은 별도 페이지 없이 step-3 완료 후 모달/인라인으로 처리 가능.
> 또는 `/diagnose/loading` 페이지 진입 전 인터스티셜로 구현.

### `src/app/diagnose/loading/page.tsx` — 로딩 + API 호출

JSX의 `phase==="loading"` + `startLoad()` + `calc()` 참조 (line 485-505, 599-604):

```
1. 로딩 스피너 (CSS animation: spin)
2. 순차 텍스트 표시 (1초 간격):
   - "129개 업종과 당신의 조건을 대조 중..."
   - "역량 적합도 계산 중..."
   - "성향 매칭 중..."
   - "10년 후 미래 시뮬레이션 중..."
   - "찾았습니다!"
3. 백그라운드에서 /api/diagnose POST 호출:
   - Zustand에서 hardFilter, getCompetencyScores(), personalityAnswers 조합
   - 응답의 sessionId 저장
4. 텍스트 완료 + API 응답 모두 받으면 → /ad?sid=[sessionId] 이동
```

### `src/app/ad/page.tsx` — 광고 페이지

JSX의 `phase==="ad"` 참조 (line 607-617):

```
- 중앙 정렬
- 카드: "ADVERTISEMENT" 라벨 + 회색 플레이스홀더 (180px 높이)
- 카운트다운 타이머 (15초) — "결과를 보려면 N초 기다려주세요"
  - 카운트 완료 전에는 버튼 비활성
- 완료 후 골드 버튼: "📊 분석 결과 확인하기" → /result/[sessionId]
```

---

## 4-4. 네비게이션 가드

각 step 페이지에서:
```typescript
'use client';
import { useRouter } from 'next/navigation';
import { useDiagnoseStore } from '@/store/diagnose-store';
import { useEffect } from 'react';

// step-2에서:
const { hardFilter } = useDiagnoseStore();
useEffect(() => {
  if (Object.keys(hardFilter).length === 0) {
    router.push('/diagnose/step-1');
  }
}, []);
```

---

## 4-5. 페이드 전환 애니메이션

JSX의 전환 패턴 (line 456):
```typescript
const go = (fn) => { setFade(false); setTimeout(() => { fn(); setFade(true); }, 200); };
```

→ Tailwind: `transition-opacity duration-200` + state로 opacity 토글

---

## 디자인 참조 (JSX → Tailwind 매핑)

| JSX 인라인 스타일 | Tailwind 클래스 |
|---|---|
| `maxWidth:480,margin:"0 auto"` | `max-w-[480px] mx-auto` |
| `minHeight:"100vh"` | `min-h-screen` |
| `background:C.bg` | `bg-quiz-bg` |
| `background:C.card` | `bg-quiz-card` |
| `border:"1px solid #1E293B"` | `border border-quiz-border` |
| `borderRadius:14` | `rounded-[14px]` |
| `color:C.g` (#94A3B8) | `text-quiz-text-secondary` |
| `color:C.gd` (#64748B) | `text-quiz-text-dim` |
| `fontSize:18,fontWeight:700` | `text-lg font-bold` |
| `padding:"20px 16px"` | `px-4 py-5` |

---

## 검증 체크리스트

```
1. http://localhost:3000/ → 랜딩 페이지 정상 렌더링 (다크 테마, 그래디언트 타이틀)
2. CTA 클릭 → /diagnose/step-1 이동
3. 하드필터 8문항 모두 표시, 선택 시 다음 질문
4. step-1 완료 → step-2 자동 이동
5. 역량진단 24문항 모두 표시, 진행바 정확
6. step-2 완료 → step-3 자동 이동
7. 성향진단 10문항 이지선다 정상 동작
8. step-3 완료 → 닉네임 입력 → 로딩 페이지
9. 로딩 페이지: 스피너 + 순차 텍스트 + API 호출
10. 광고 페이지: 카운트다운 → 결과 버튼 활성화
11. 전체 플로우 중 새로고침 → localStorage에서 상태 복원
12. /diagnose/step-3 직접 접속 시 step-1로 리다이렉트
13. 모바일 375px에서 overflow 없음
```
