import { cn } from '@/lib/utils';

export function QuestionCard({
  stepLabel,
  helper,
  question,
  children,
  className
}: {
  stepLabel: string;
  helper?: string;
  question: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[22px] border border-quiz-border bg-quiz-card/95 p-5 shadow-[0_24px_80px_rgba(3,7,18,0.32)]', className)}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-quiz-text-secondary">{stepLabel}</p>
      {helper ? <p className="mb-3 text-[12px] leading-6 text-quiz-text-dim">{helper}</p> : null}
      <h2 className="mb-5 text-[22px] font-bold leading-[1.45] text-quiz-text">{question}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
