import { cn } from '@/lib/utils';

export function SectionCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn('rounded-[22px] border border-quiz-border bg-quiz-card/90 p-5 backdrop-blur', className)}>{children}</section>;
}
