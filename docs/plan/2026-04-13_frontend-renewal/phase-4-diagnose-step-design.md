# Phase 4: 진단 스텝 페이지 디자인 개선

- 예상 소요: 1시간
- 수정 파일: 6개
- 커밋: 단일

## 목표

- Step 페이지 진입감을 통일
- 카드 hover 움직임을 덜 흔들리게 조정
- 로딩 화면과 완료 화면의 시각 톤을 맞춤

## 작업 순서

### 1. 페이지 진입 애니메이션 추가

- `src/app/diagnose/step-1/page.tsx`
- `src/app/diagnose/step-2/page.tsx`
- `src/app/diagnose/step-3/page.tsx`
- `src/app/diagnose/loading/page.tsx`

각 `<main>`에 `animate-fade-up` 추가

### 2. `QuestionCard` 그림자 유지

- `src/components/diagnose/QuestionCard.tsx`
- 현재 그림자 `shadow-[0_24px_80px_rgba(3,7,18,0.32)]`는 유지
- 이 Phase에서는 그림자 값 변경 없음

### 3. `OptionButton` hover 방향 변경

- `src/components/diagnose/OptionButton.tsx`

```diff
- hover:translate-x-1
+ hover:-translate-y-0.5
```

이유:
- 좌우 흔들림보다 카드 리프트가 덜 거슬림
- 세로 카드 리스트에서 정렬 안정성이 좋음

## 완료 체크

- step-1, step-2, step-3, loading 진입 시 페이드업 확인
- hover 시 레이아웃 밀림 없는지 확인
