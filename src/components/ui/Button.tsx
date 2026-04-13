'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'gold' | 'default' | 'ghost';
  full?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', full, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-md px-6 py-3.5 text-[15px] font-bold',
        'cursor-pointer border border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-quiz-teal-light text-white shadow-teal hover:brightness-110',
        variant === 'gold' && 'bg-gradient-to-br from-quiz-gold to-quiz-gold-light text-quiz-bg shadow-gold',
        variant === 'default' && 'border-quiz-border bg-quiz-card text-quiz-text-secondary hover:bg-quiz-hover',
        variant === 'ghost' && 'bg-transparent text-quiz-text-secondary hover:text-quiz-text',
        full && 'w-full',
        className
      )}
      {...props}
    />
  );
});
