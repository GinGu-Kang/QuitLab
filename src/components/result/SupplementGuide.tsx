import competencyGuideJson from '@/data/competency-guide.json';
import type { CompetencyGuide as CompetencyGuideItem, MatchResult } from '@/types';

const guides = competencyGuideJson as CompetencyGuideItem[];

export function SupplementGuide({ result }: { result: MatchResult }) {
  const relevant = result.competencyGap
    .map((gap) => guides.find((guide) => guide.competency === gap.competency))
    .filter(Boolean) as CompetencyGuideItem[];

  return (
    <div className="space-y-3">
      {relevant.length ? relevant.map((guide) => (
        <div key={guide.competency} className="rounded-md border border-quiz-border bg-quiz-card p-5">
          <h3 className="text-lg font-bold">{guide.name}</h3>
          <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">{guide.definition}</p>
          <p className="mt-3 text-xs font-semibold text-quiz-teal-light">보완 방법</p>
          <p className="mt-1 text-sm leading-7 text-quiz-text-secondary">{guide.examples}</p>
          <p className="mt-3 text-xs font-semibold text-quiz-gold-light">점수 기준</p>
          <p className="mt-1 text-sm leading-7 text-quiz-text-secondary">{guide.scoringCriteria}</p>
        </div>
      )) : (
        <div className="rounded-md border border-quiz-border bg-quiz-card p-5 text-sm text-quiz-text-secondary">
          역량 부족 항목이 크지 않습니다. 상권 조사와 운영 루틴 검증에 시간을 배분해보세요.
        </div>
      )}
    </div>
  );
}
