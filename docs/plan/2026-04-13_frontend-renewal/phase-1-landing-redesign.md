# Phase 1: 랜딩 페이지 리디자인

- 상태: 완료
- 완료일: 2026-04-13
- 커밋: `8610969`
- 범위: 랜딩 첫 화면의 시각 언어 전면 정리

## 수정 파일

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/ui/Button.tsx`
- `src/components/ui/SectionCard.tsx`

## 이미 반영된 변경

- 피처 카드 그리드 제거 후 히어로 중심 구성으로 재배치
- 보라 계열 중심 톤 제거
- CTA 버튼을 솔리드 틸 중심으로 통일
- radius 체계 초안 적용
- 진입 애니메이션 `fade-up` 추가

## 검증

- 랜딩 페이지 단독 렌더링 확인
- 첫 CTA 클릭 후 `/diagnose/step-1` 이동 확인
- 모바일/데스크톱에서 텍스트 줄바꿈 확인
