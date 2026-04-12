import * as React from 'react';

import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'min-h-11 w-full rounded-[14px] border border-quiz-border bg-quiz-card px-4 py-3 text-[15px] text-quiz-text',
        'placeholder:text-quiz-text-dim focus:border-quiz-teal',
        className
      )}
      {...props}
    />
  );
});
