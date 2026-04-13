# Phase 5: 결과 페이지 디자인 개선

- 예상 소요: 30분
- 수정 파일: 2개
- 커밋: 단일

## 목표

- 결과 탭 접근성 보강
- 결과 탭의 구조를 조금 더 명확하게 정리

## 작업 순서

### 1. `src/components/result/ResultPageClient.tsx`

- 탭 컨테이너에 `role="tablist"` 추가
- 각 탭 버튼에 아래 속성 추가

```tsx
role="tab"
aria-selected={activeTab === tab.key}
```

- 모바일 2열 변경은 Phase 6에서 처리하므로 여기서는 접근성 속성만 추가

### 2. `src/components/result/StartupGuide.tsx`

- `quiz-pink` 참조 제거가 남아 있으면 정리
- 원본 플랜 기준으론 Phase 2-13에서 이미 처리된 항목이라, 잔여 참조 확인만 수행

## 완료 체크

- 탭 이동 시 선택 상태가 스크린리더 속성으로 반영되는지 확인
- `quiz-pink` 잔여 참조 없는지 확인
