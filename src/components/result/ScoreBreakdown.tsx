import type { MatchResult } from '@/types';

const segments = [
  { key: 'competencyFit', label: '역량 50%', color: '#14B8A6' },
  { key: 'personalityFit', label: '성향 30%', color: '#F59E0B' },
  { key: 'careerSynergy', label: '경력 10%', color: '#8B5CF6' },
  { key: 'marketAttractiveness', label: '시장 10%', color: '#EC4899' }
] as const;

export function ScoreBreakdown({ results }: { results: MatchResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((result) => {
        const weights = [
          result.breakdown.competencyFit * 0.5,
          result.breakdown.personalityFit * 0.3,
          result.breakdown.careerSynergy * 0.1,
          result.breakdown.marketAttractiveness * 0.1
        ];
        const total = weights.reduce((sum, value) => sum + value, 0);

        return (
          <div key={result.item.id} className="rounded-[18px] border border-quiz-border bg-quiz-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">{result.item.name}</h3>
              <span className="text-sm font-semibold text-quiz-teal-light">{Math.round(result.finalScore)}점</span>
            </div>

            <div className="flex h-3 overflow-hidden rounded-full bg-quiz-border">
              {weights.map((weight, index) => (
                <div
                  key={`${result.item.id}_${segments[index].key}`}
                  style={{
                    width: `${total ? (weight / total) * 100 : 0}%`,
                    background: segments[index].color
                  }}
                />
              ))}
            </div>

            <div className="mt-3 grid gap-2 text-xs text-quiz-text-secondary sm:grid-cols-2">
              {segments.map((segment, index) => (
                <div key={segment.key} className="flex items-center justify-between rounded-xl bg-quiz-bg/70 px-3 py-2">
                  <span>{segment.label}</span>
                  <span>{Math.round(weights[index])}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
