# 프론트엔드 디자인 리뉴얼 리서치

> 작성일: 2026-04-13
> 분석 범위: src/app/, src/components/ 전체 (~50개 파일, ~1,319 LOC)

---

## 1. 현재 컴포넌트 구조

### UI 공통 (src/components/ui/)
| 파일 | LOC | 역할 |
|------|-----|------|
| Button.tsx | 33 | 4개 variant (primary/gold/default/ghost) |
| Input.tsx | 20 | 텍스트 입력, border focus |
| ProgressBar.tsx | 24 | 스텝 진행률 표시, gradient className |
| SectionCard.tsx | 11 | 카드 래퍼, backdrop-blur |

### 진단 플로우 (src/components/diagnose/)
| 파일 | LOC | 역할 |
|------|-----|------|
| QuestionCard.tsx | 24 | 질문 표시 카드 |
| HardFilterQuestion.tsx | 24 | 하드 필터 옵션 (2열 그리드) |
| OptionButton.tsx | 33 | 단일 선택 버튼 (아이콘+제목+부제) |
| BinaryChoice.tsx | 28 | 이진 선택 비교 |

### 결과 페이지 (src/components/result/) — 16개 컴포넌트
| 파일 | LOC | 역할 |
|------|-----|------|
| ResultPageClient.tsx | 156 | 메인 컨테이너, 4탭 |
| Top5Cards.tsx | 38 | TOP 5 추천 카드 |
| DiagnosisSummary.tsx | 15 | 창업가 유형 요약 |
| ScoreBreakdown.tsx | 54 | 점수 구성 바 차트 |
| RadarChart.tsx | 61 | 레이더 차트 (사용자 vs 요구) |
| CompetencyGap.tsx | 39 | 역량 격차 바 차트 |
| WhyRecommended.tsx | 75 | 추천 이유 (강점/약점 태그) |
| SupplementGuide.tsx | 29 | 보완 가이드 |
| RiskWarning.tsx | 51 | 리스크 경고 |
| ChecklistCard.tsx | 26 | 8개 항목 체크리스트 |
| StartupGuide.tsx | 76 | 비용 구조 확장형 가이드 |
| FutureVision.tsx | 32 | 10년 비전 내러티브 |
| GovernmentSupport.tsx | 19 | 정부 지원 프로그램 |
| Roadmap.tsx | 32 | 6단계 타임라인 |
| EmailCollector.tsx | 104 | 이메일 수집 폼 |
| ShareButtons.tsx | 34 | 공유 버튼 (링크복사, 카카오) |

### 페이지 (src/app/)
| 경로 | LOC | 비고 |
|------|-----|------|
| page.tsx (랜딩) | 72 | ✅ Phase 1에서 리디자인 완료 |
| diagnose/step-1 | 79 | 하드 필터 |
| diagnose/step-2 | 75 | 역량 진단 (24문항) |
| diagnose/step-3 | 109 | 성향 진단 (10문항) + 이름 입력 |
| diagnose/loading | 94 | 로딩 애니메이션 |
| result/[sessionId] | 34 | 결과 페이지 래퍼 |
| admin/ | 8+38+78 | 대시보드, 고객관리 |

---

## 2. 컬러 시스템 분석

### 정의된 토큰 (tailwind.config.ts)
```
quiz-bg: #0A0E1A        quiz-card: #111827       quiz-hover: #1F2A42
quiz-border: #1E293B     quiz-teal: #0D9488       quiz-teal-light: #14B8A6
quiz-gold: #F59E0B       quiz-gold-light: #FCD34D  quiz-purple: #8B5CF6
quiz-pink: #EC4899       quiz-green: #10B981       quiz-text: #F1F5F9
quiz-text-secondary: #94A3B8   quiz-text-dim: #64748B
```

### 토큰 사용 빈도
| 토큰 | 사용 횟수 | 판정 |
|------|-----------|------|
| quiz-border | 59 | ✅ 핵심 |
| quiz-text-secondary | 59 | ✅ 핵심 |
| quiz-card | 41 | ✅ 핵심 |
| quiz-bg | 21 | ✅ 핵심 |
| quiz-text-dim | 15 | ✅ 활용 |
| quiz-teal-light | 15 | ✅ 활용 |
| quiz-teal | 10 | ✅ 활용 |
| quiz-text | 9 | ✅ 활용 |
| quiz-gold-light | 8 | ⚠️ 보통 |
| quiz-gold | 5 | ⚠️ 보통 |
| quiz-green | 3 | ⚠️ 미활용 |
| quiz-pink | 2 | ❌ 거의 미사용 |
| quiz-purple | 1 | ❌ 거의 미사용 |
| quiz-hover | 1 | ❌ 거의 미사용 |

### 인라인 rgba 하드코딩 (토큰화 필요)
| 파일:라인 | 값 | 용도 |
|-----------|----|------|
| ResultPageClient.tsx:92 | rgba(20,184,166,0.12) 등 | 배경 그라디언트 |
| ResultPageClient.tsx:117-120 | #0D9488, #1E293B 등 | 탭 인라인 스타일 |
| WhyRecommended.tsx:24 | rgba(245,158,11,0.2/0.08) | 골드 투명 변형 |
| WhyRecommended.tsx:45 | rgba(13,148,136,0.08) | 틸 투명 변형 |
| WhyRecommended.tsx:52 | rgba(16,185,129,0.28/0.1) | 그린 투명 변형 |
| WhyRecommended.tsx:63 | rgba(245,158,11,0.28/0.1) | 골드 투명 변형 |
| Top5Cards.tsx:9 | rgba(13,148,136,0.08) | 틸 투명 변형 |
| Top5Cards.tsx:20 | rgba(239,68,68,0.25/0.06) | 레드 (토큰 없음) |
| FutureVision.tsx:8 | rgba(139,92,246,0.2/0.08) | 퍼플 투명 변형 |
| FutureVision.tsx:12 | 3색 그라디언트 (틸/퍼플/핑크) | 아바타 그라디언트 |
| DiagnosisSummary.tsx:7 | rgba(13,148,136,0.25/0.08) | 틸 투명 변형 |
| loading/page.tsx:86 | rgba(20,184,166,0.14) | 틸 투명 변형 |

### 차트 하드코딩 컬러
| 파일 | 사용 컬러 |
|------|-----------|
| ScoreBreakdown.tsx:4-8 | #14B8A6, #F59E0B, **#8B5CF6**, **#EC4899** |
| StartupGuide.tsx:8-11 | #14B8A6, **#8B5CF6**, #F59E0B, **#EC4899** |
| RadarChart.tsx:31-32,46 | #14B8A6, #F59E0B, **#EF4444** |
| CompetencyGap.tsx:32 | #14B8A6, #F59E0B |

### Tailwind 기본 컬러 직접 사용 (토큰 바이패스)
- `text-red-400`, `text-red-100/80`, `text-red-300`, `bg-red-400` — RiskWarning, Top5Cards
- `text-green-200` — WhyRecommended
- `text-yellow-200` — WhyRecommended

### 제거 대상: 퍼플/핑크 사용처
| 파일 | 사용 방식 |
|------|-----------|
| BinaryChoice.tsx:19 | hover:border-quiz-purple |
| FutureVision.tsx:8,12 | 보더, 아바타 그라디언트 |
| ScoreBreakdown.tsx:4-8 | 차트 세그먼트 색상 |
| StartupGuide.tsx:8-11 | 비용 구조 차트 색상 |
| step-1-gradient | F59E0B → **EC4899** |
| step-2-gradient | 0D9488 → **8B5CF6** |
| step-3-gradient | **8B5CF6** → **EC4899** |
| Button.tsx (gold variant) | from-quiz-gold to-**quiz-pink** |

---

## 3. Border-Radius 분석

### 정의된 토큰 vs 실제 사용
| 토큰 | 값 | 실제 사용 횟수 |
|------|-----|----------------|
| rounded-sm (8px) | tailwind.config | 0 (미사용) |
| rounded-md (12px) | tailwind.config | 1 (Button만) |
| rounded-lg (16px) | tailwind.config | 1 (SectionCard만) |

### 하드코딩된 값 (9종류 혼재)
| 값 | 사용 횟수 | 용도 |
|----|-----------|------|
| rounded-[14px] | 12 | Input, OptionButton, 각종 카드 |
| rounded-[18px] | 15 | 카드 패널, 결과 섹션 |
| rounded-[20px] | 13 | 대형 카드, TOP 결과 |
| rounded-[22px] | 7 | 질문 카드, 대형 컨테이너 |
| rounded-[24px] | 8 | 페이지 컨테이너, 어드민 |
| rounded-[16px] | 4 | 가이드, 로드맵 |
| rounded-[12px] | 1 | 탭 버튼 |
| rounded-full | 6 | 프로그레스 닷, 뱃지 |

**판정: 토큰 정의만 하고 전혀 사용하지 않음. 9가지 값이 혼재.**

---

## 4. 타이포그래피 분석

### 임의 폰트 사이즈 (토큰화 필요)
| 값 | 횟수 | 용도 |
|----|------|------|
| text-[10px] | 1 | RadarChart 범례 |
| text-[11px] | 3 | 스텝 라벨, 경고 |
| text-[12px] | 1 | 탭 라벨 |
| text-[13px] | 4 | 뱃지, 라벨 |
| text-[15px] | 3 | Button, Input |
| text-[16px] | 2 | 페이지 설명 |
| text-[22px] | 1 | QuestionCard h2 |
| text-[28px] | 2 | 대형 헤딩 |
| text-[30px] | 1 | 결과 페이지 타이틀 |
| text-[40px] | 1 | 랜딩 h1 |

**Tailwind 표준 사이즈도 병행 사용** (text-xs 32회, text-sm 58회, text-lg 14회)
→ 2가지 전략이 혼재되어 일관성 없음

### 폰트 웨이트
- font-bold: 31회, font-semibold: 28회, font-black: 4회, font-extrabold: 3회
- font-medium, font-normal 사용 없음 → 굵기 편향

---

## 5. 반응형 디자인 분석

### 브레이크포인트 사용 현황
| 브레이크포인트 | 사용 횟수 | 주요 파일 |
|---------------|-----------|-----------|
| sm: (640px) | 9 | 랜딩, 결과, 바이너리 |
| md: (768px) | 5 | 어드민만 |
| lg: (1024px) | 3 | 결과 페이지 |
| xl: (1280px) | 1 | 어드민 대시보드 |

### 반응형 미지원 페이지
- **diagnose/step-1,2,3** — `max-w-[520px]` 고정, 모바일 조정 없음
- **ad 페이지** — 고정 너비
- **privacy, terms** — 브레이크포인트 없음
- **Roadmap** — `min-w-[720px]` 가로 스크롤 의존

**판정: 5/10. 태블릿/데스크탑은 OK, 모바일 퍼스트 접근 부재.**

---

## 6. 접근성 분석

### 심각한 부재
- aria-* 속성: **0개** (전체 코드베이스)
- role 속성: **0개**
- aria-label: 아이콘 전용 버튼에 없음 (ResultPageClient 탭)
- aria-live: 로딩 상태에 없음
- skip-to-main-content 링크: 없음

### 양호한 부분
- 시맨틱 HTML (`<main>`, `<section>`, `<button>`)
- 커스텀 focus-visible 스타일 (globals.css)
- 폼 label 연결 (일부)

### 컬러 대비 문제
- `#64748B` (quiz-text-dim) on `#111827` (quiz-card) = **3.73:1** → WCAG AA 미달 (4.5:1 필요)

---

## 7. 애니메이션/전환 분석

### 정의됨
- fade-up + 3단계 딜레이 (globals.css) — 랜딩에서 사용
- spin (tailwind.config) — 로딩에서 사용
- **pulseSlow** — 정의만 하고 **미사용** (데드 코드)

### 전역 전환
- `a, button`: 180ms ease (color, border, bg, transform, opacity, box-shadow)

---

## 8. 아이콘 사용 분석

- lucide-react 아이콘: **2개만** (ArrowRight, Loader2)
- 나머지 전부 이모지 문자열 (✨, 🏆, 💡, 📋, ⚠️ 등)
- 일관성 없음: 아이콘 라이브러리 vs 이모지 혼용

---

## 9. 종합 판정

### 심각도별 분류

**🔴 Critical (즉시 수정)**
1. border-radius 토큰 미사용 — 9가지 값 혼재
2. 인라인 rgba 컬러 12+ 곳 — 토큰화 필요
3. 접근성 aria 속성 전무
4. 컬러 대비 WCAG AA 미달

**🟡 Major (Phase별 수정)**
5. 퍼플/핑크 제거 (AI slop 잔재)
6. 타이포그래피 10가지 임의 사이즈
7. 모바일 반응형 부재 (진단 페이지)
8. 차트 컬러 하드코딩

**🟢 Minor (개선)**
9. pulseSlow 데드 코드 제거
10. 아이콘 전략 통일 (이모지 vs lucide)
11. quiz-hover 토큰 활용 확대
