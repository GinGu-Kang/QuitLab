import { COMPETENCY_ICONS, COMPETENCY_KEYS, COMPETENCY_LABELS, type MatchResult } from '@/types';

function buildStrengthTags(result: MatchResult, userScores: number[]) {
  return COMPETENCY_KEYS.map((key, index) => ({
    label: COMPETENCY_LABELS[index],
    icon: COMPETENCY_ICONS[index],
    user: userScores[index],
    required: result.item.competencyScores[key]
  })).filter((entry) => entry.required >= 4 && entry.user >= 4);
}

function buildWeaknessTags(result: MatchResult, userScores: number[]) {
  return COMPETENCY_KEYS.map((key, index) => ({
    label: COMPETENCY_LABELS[index],
    icon: COMPETENCY_ICONS[index],
    user: userScores[index],
    required: result.item.competencyScores[key]
  })).filter((entry) => entry.required >= 4 && entry.user <= 2);
}

export function WhyRecommended({ results, userScores }: { results: MatchResult[]; userScores: number[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-quiz-gold-border bg-quiz-gold-subtle p-5">
        <h3 className="text-[15px] font-bold text-quiz-gold-light">왜 이 자영업이 추천되었을까?</h3>
        <p className="mt-2 text-sm text-quiz-text-secondary">12가지 역량과 현실 조건, 경력, 성향을 종합 분석한 결과예요.</p>
      </div>

      {results.map((result, index) => {
        const strengths = buildStrengthTags(result, userScores);
        const weaknesses = buildWeaknessTags(result, userScores);
        return (
          <div
            key={result.item.id}
            className={`rounded-md border bg-quiz-card p-5 ${index === 0 ? 'border-quiz-teal' : 'border-quiz-border'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-quiz-text-secondary">{index + 1}위 추천</p>
                <h4 className="mt-1 text-xl font-bold">{result.item.name}</h4>
              </div>
              <span className="rounded-full bg-quiz-bg px-3 py-1 text-xs text-quiz-gold-light">{Math.round(result.finalScore)}점</span>
            </div>

            <div className="mt-4 rounded-sm bg-quiz-teal-subtle p-4 text-sm leading-7 text-quiz-text-secondary">{result.reason}</div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-2 text-xs font-semibold text-quiz-green">✅ 딱 맞는 역량</p>
                <div className="flex flex-wrap gap-2">
                  {strengths.length ? strengths.map((entry) => (
                    <span key={`${result.item.id}_${entry.label}`} className="rounded-full border border-quiz-green-border bg-quiz-green-subtle px-3 py-1 text-xs text-green-200">
                      {entry.icon} {entry.label} (내 {entry.user} ≥ 필요 {entry.required})
                    </span>
                  )) : <span className="text-xs text-quiz-text-dim">두드러진 강점은 결과 전체 문맥에서 반영됐어요.</span>}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-quiz-gold-light">⚠️ 보완하면 좋은 점</p>
                <div className="flex flex-wrap gap-2">
                  {weaknesses.length ? weaknesses.map((entry) => (
                    <span key={`${result.item.id}_weak_${entry.label}`} className="rounded-full border border-quiz-gold-border bg-quiz-gold-subtle px-3 py-1 text-xs text-yellow-200">
                      {entry.icon} {entry.label} (내 {entry.user} &lt; 필요 {entry.required})
                    </span>
                  )) : <span className="text-xs text-quiz-text-dim">핵심 역량 큰 부족은 보이지 않아요.</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
