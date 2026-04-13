import { cn } from '@/lib/utils';

interface ProgressBarProps {
  total: number;
  current: number;
  gradientClassName: string;
  className?: string;
}

export function ProgressBar({ total, current, gradientClassName, className }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label="진행률"
      className={cn('mb-4 flex gap-[3px]', className)}
    >
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={cn(
            'h-1 flex-1 rounded-full bg-quiz-border',
            index <= current && gradientClassName
          )}
        />
      ))}
    </div>
  );
}
