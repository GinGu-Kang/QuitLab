# Phase 7: 접근성 & 마이크로카피

- 예상 소요: 30분
- 수정 파일: 4개
- 커밋: 단일

## 목표

- 기본 접근성 속성 보강
- skip link 추가
- 텍스트 대비를 WCAG AA 수준으로 상향

## 작업 순서

### 1. `src/components/ui/ProgressBar.tsx`

- 외부 래퍼에 아래 속성 추가

```tsx
role="progressbar"
aria-valuenow={current + 1}
aria-valuemin={1}
aria-valuemax={total}
aria-label="진행률"
```

### 2. `src/app/diagnose/loading/page.tsx`

- 현재 스텝 텍스트에 `aria-live="polite"` 추가

### 3. `src/app/layout.tsx`

- `body` 직후 skip link 추가

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-quiz-teal focus:px-4 focus:py-2 focus:text-white"
>
  본문으로 건너뛰기
</a>
```

- 각 페이지의 `<main>`에 `id="main-content"` 추가 필요

### 4. `tailwind.config.ts`

- `quiz.text-dim` 색상을 `#7C8BA1`로 상향

```diff
- 'text-dim': '#64748B'
+ 'text-dim': '#7C8BA1'
```

## 최종 체크

- 스크린리더용 진행률/로딩 문구 반영 확인
- 키보드로 skip link 노출 확인
- `quiz-text-dim` 대비 개선 확인
