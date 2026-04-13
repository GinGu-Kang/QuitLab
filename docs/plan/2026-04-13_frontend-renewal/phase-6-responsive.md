# Phase 6: 반응형 개선

- 예상 소요: 45분
- 수정 파일: 5개
- 커밋: 단일

## 목표

- 375px 모바일 기준 결과 페이지 사용성 개선
- 차트와 로드맵의 세로 공간 낭비 감소

## 작업 순서

### 1. `src/components/result/ResultPageClient.tsx`

- 탭을 모바일에서 2열로 변경

```diff
- sm:grid-cols-4
+ grid-cols-2 ... sm:grid-cols-4
```

- 결과 제목 폰트 크기 반응형 조정

```diff
- text-[30px] ... sm:text-[38px]
+ text-[24px] ... sm:text-[30px] lg:text-[38px]
```

### 2. `src/components/result/RadarChart.tsx`

- 모바일 높이 `220px`, `sm` 이상 `280px`

### 3. `src/components/result/CompetencyGap.tsx`

- 모바일 높이 `260px`, `sm` 이상 `320px`

### 4. `src/components/result/Roadmap.tsx`

- 모바일에서 세로 스택
- `sm` 이상에서만 가로 스크롤 + 가로 배치
- 단계 사이 커넥터는 모바일에서 숨김

## 완료 체크

- 375px에서 탭 두 줄 배치 확인
- 레이더 차트/갭 차트가 화면 밖으로 넘치지 않는지 확인
- 로드맵이 모바일에서 읽기 순서대로 세로 정렬되는지 확인
