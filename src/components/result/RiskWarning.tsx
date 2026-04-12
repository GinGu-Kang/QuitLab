import type { MatchResult } from '@/types';

export function RiskWarning({ results }: { results: MatchResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div key={result.item.id} className="rounded-[18px] border border-quiz-border bg-quiz-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">{result.item.name}</h3>
              <p className="mt-1 text-sm text-quiz-text-secondary">{result.item.category}</p>
            </div>
            <div className="rounded-full bg-quiz-bg px-3 py-1 text-xs text-quiz-text-secondary">{result.item.competitionLevel}/5 경쟁</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[14px] bg-quiz-bg/70 p-4">
              <p className="text-xs text-quiz-text-dim">폐업률 (3년)</p>
              <p className="mt-1 text-sm font-semibold text-red-300">{result.item.closureRate}</p>
            </div>
            <div className="rounded-[14px] bg-quiz-bg/70 p-4">
              <p className="text-xs text-quiz-text-dim">계절성</p>
              <p className="mt-1 text-sm font-semibold text-quiz-text-secondary">{result.item.seasonality}</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-quiz-text-secondary">
                <span>경쟁강도</span>
                <span>{result.item.competitionLevel}/5</span>
              </div>
              <div className="h-2 rounded-full bg-quiz-border">
                <div className="h-full rounded-full bg-red-400" style={{ width: `${(result.item.competitionLevel / 5) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-quiz-text-secondary">
                <span>진입장벽</span>
                <span>{result.item.entryBarrier}/5</span>
              </div>
              <div className="h-2 rounded-full bg-quiz-border">
                <div className="h-full rounded-full bg-quiz-gold" style={{ width: `${(result.item.entryBarrier / 5) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
