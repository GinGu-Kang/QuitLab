import { getEntrepreneurType } from '@/lib/matching';

export function DiagnosisSummary({ scores }: { scores: number[] }) {
  const type = getEntrepreneurType(scores);

  return (
    <div className="rounded-[22px] border border-[rgba(13,148,136,0.25)] bg-[rgba(13,148,136,0.08)] p-5">
      <p className="text-[11px] font-semibold text-quiz-text-secondary">당신의 진단 결과</p>
      <h2 className="mt-2 bg-gradient-to-r from-quiz-teal-light via-quiz-gold-light to-quiz-gold bg-clip-text text-[28px] font-extrabold text-transparent">
        {type.name}
      </h2>
      <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">{type.desc}</p>
    </div>
  );
}
