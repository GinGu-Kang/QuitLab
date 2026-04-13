import { cn } from '@/lib/utils';

export function BinaryChoice({
  left,
  right
}: {
  left: { text: string; icon?: string; onClick: () => void };
  right: { text: string; icon?: string; onClick: () => void };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[left, right].map((option) => (
        <button
          key={option.text}
          type="button"
          onClick={option.onClick}
          className={cn(
            'flex min-h-40 cursor-pointer flex-col justify-between rounded-md border border-quiz-border bg-quiz-card p-5 text-left',
            'hover:-translate-y-1 hover:border-quiz-teal hover:bg-quiz-hover'
          )}
        >
          <span className="text-2xl">{option.icon}</span>
          <strong className="mt-6 text-lg leading-8 text-quiz-text">{option.text}</strong>
        </button>
      ))}
    </div>
  );
}
