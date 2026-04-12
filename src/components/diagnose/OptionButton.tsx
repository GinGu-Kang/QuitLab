import { cn } from '@/lib/utils';

export function OptionButton({
  icon,
  title,
  subtitle,
  selected,
  onClick
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-[14px] border bg-quiz-card px-4 py-3.5 text-left',
        'hover:translate-x-1 hover:border-quiz-teal hover:bg-quiz-hover',
        selected ? 'border-quiz-teal bg-quiz-hover text-quiz-text' : 'border-quiz-border text-quiz-text'
      )}
    >
      {icon ? <span className="text-xl">{icon}</span> : null}
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-quiz-text-secondary">{subtitle}</div> : null}
      </div>
    </button>
  );
}
