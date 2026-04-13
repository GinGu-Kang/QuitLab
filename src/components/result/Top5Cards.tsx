import type { MatchResult } from '@/types';

export function Top5Cards({ results }: { results: MatchResult[] }) {
  const [top, ...rest] = results;
  if (!top) return null;

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg border-2 border-quiz-teal bg-quiz-teal-subtle p-5">
        <div className="absolute -top-3 left-4 rounded-full bg-quiz-gold px-3 py-1 text-xs font-bold text-quiz-bg">🏆 1순위 추천</div>
        <h3 className="mt-3 text-[28px] font-extrabold leading-tight">{top.item.name}</h3>
        <p className="mt-2 text-sm text-quiz-text-secondary">
          <span className="font-semibold text-quiz-teal-light">{top.item.category}</span>
          <span className="mx-2 text-quiz-text-dim">·</span>
          <span className="text-quiz-gold-light">초기 투자비 {top.item.investmentRange}</span>
        </p>
        <p className="mt-4 text-sm leading-7 text-quiz-text-secondary">{top.reason}</p>
      </div>

      <div className="rounded-md border border-quiz-red-border bg-quiz-red-subtle p-4">
        <p className="text-[11px] font-bold text-red-400">⚠️ 알고 시작하세요</p>
        <p className="mt-2 text-xs leading-6 text-red-100/80">
          추천은 적합도 기준일 뿐 성공 보장은 아닙니다. 가이드 탭에서 폐업률, 경쟁강도, 실제 수익 구조를 꼭 확인하세요.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rest.map((entry, index) => (
          <div key={entry.item.id} className="rounded-sm border border-quiz-border bg-quiz-card p-4">
            <p className="text-sm font-semibold text-quiz-text-secondary">{index === 0 ? '🥈 2위' : index === 1 ? '🥉 3위' : `${index + 2}위`}</p>
            <h4 className="mt-2 text-base font-bold">{entry.item.name}</h4>
            <p className="mt-2 text-xs text-quiz-text-dim">{entry.item.investmentRange}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
