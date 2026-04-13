# Phase 3: Border-Radius 통일

- 예상 소요: 30분
- 수정 파일: 20개
- 커밋: 단일

## 목표

- radius 값을 3단계 체계로 통일
- 소형/중형/대형 컨테이너 기준을 명확히 맞춤

## 매핑 규칙

| 현재 값 | 변경 | 용도 |
|---------|------|------|
| `rounded-[12px]`, `rounded-[14px]` | `rounded-sm` | 입력, 버튼 내부, 태그, 소형 카드 |
| `rounded-[16px]`, `rounded-[18px]` | `rounded-md` | 카드, 섹션, 탭 패널 |
| `rounded-[20px]`, `rounded-[22px]`, `rounded-[24px]` | `rounded-lg` | 대형 컨테이너, 페이지 래퍼 |
| `rounded-full` | 유지 | 원형 UI |
| `rounded-xl` | 유지 | 기존 ScoreBreakdown 사용처 |

## 파일별 적용

### UI 공용

- `src/components/ui/Input.tsx` → `rounded-sm`
- `src/components/diagnose/QuestionCard.tsx` → `rounded-lg`
- `src/components/diagnose/OptionButton.tsx` → `rounded-sm`
- `src/components/diagnose/BinaryChoice.tsx` → `rounded-md`

### 결과 페이지

- `src/components/result/ResultPageClient.tsx`
  - 탭 컨테이너 `rounded-lg`
  - 탭 버튼 `rounded-sm`
  - 요약 카드들 `rounded-md`
- `src/components/result/Top5Cards.tsx`
  - 메인 카드 `rounded-lg`
  - 경고 카드 `rounded-md`
  - 태그 `rounded-sm`
- `src/components/result/DiagnosisSummary.tsx` → `rounded-lg`
- `src/components/result/ScoreBreakdown.tsx` → `rounded-md`
- `src/components/result/RadarChart.tsx` → `rounded-lg`
- `src/components/result/CompetencyGap.tsx` → `rounded-lg`
- `src/components/result/WhyRecommended.tsx`
  - 래퍼 `rounded-lg`
  - 내부 카드 `rounded-md`
  - 태그 박스 `rounded-sm`
- `src/components/result/SupplementGuide.tsx` → `rounded-md`
- `src/components/result/RiskWarning.tsx`
  - 래퍼 `rounded-md`
  - 내부 바/배지 `rounded-sm`
- `src/components/result/ChecklistCard.tsx` → `rounded-md`
- `src/components/result/StartupGuide.tsx`
  - 메인 `rounded-md`
  - 내부 블록 `rounded-sm`
- `src/components/result/FutureVision.tsx`
  - 래퍼 `rounded-lg`
  - 메인 박스 `rounded-lg`
  - 서브 카드 `rounded-md`
- `src/components/result/GovernmentSupport.tsx` → `rounded-md`
- `src/components/result/Roadmap.tsx`
  - 래퍼 `rounded-md`
  - 단계 카드 `rounded-md`
- `src/components/result/EmailCollector.tsx` → `rounded-md`
- `src/components/result/ShareButtons.tsx` → `rounded-md`

### 기타 페이지

- `src/components/ad/AdPageClient.tsx`
  - 외부 래퍼 `rounded-lg`
  - 광고 박스 `rounded-lg`
  - 내부 박스 `rounded-md`
- `src/components/AdBanner.tsx` → `rounded-lg`
- `src/app/diagnose/step-3/page.tsx` 완료 카드 → `rounded-lg`

## 완료 체크

- `rg -n "rounded-\\[(12|14|16|18|20|22|24)px\\]" src`
- 잔여 값이 의도한 예외 외 0건인지 확인
