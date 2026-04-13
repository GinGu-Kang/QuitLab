'use client';

import { useEffect } from 'react';
import hardFiltersJson from '@/data/hard-filters.json';
import { useRouter } from 'next/navigation';

import { HardFilterQuestion } from '@/components/diagnose/HardFilterQuestion';
import { QuestionCard } from '@/components/diagnose/QuestionCard';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { recordEvent } from '@/lib/analytics';
import { useDiagnoseStore } from '@/store/diagnose-store';
import type { HardFilter } from '@/types';

const hardFilters = hardFiltersJson as HardFilter[];

export default function Step1Page() {
  const router = useRouter();
  const {
    trackingId,
    hardFilterIndex,
    setHardFilter,
    nextHardFilter,
    setCurrentStep,
    setHardFilterIndex
  } = useDiagnoseStore();

  useEffect(() => {
    setCurrentStep(1);
    void recordEvent('step1_start', trackingId);
  }, [setCurrentStep, trackingId]);

  const current = hardFilters[hardFilterIndex];

  if (!current) {
    router.replace('/diagnose/step-2');
    return null;
  }

  function advanceWithValue(value: string | number | boolean) {
    setHardFilter(current.id, value as never);
    if (hardFilterIndex === hardFilters.length - 1) {
      void recordEvent('step1_complete', trackingId);
      router.push('/diagnose/step-2');
      return;
    }
    nextHardFilter();
  }

  return (
    <main id="main-content" className="animate-fade-up mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
      <ProgressBar total={hardFilters.length} current={hardFilterIndex} gradientClassName="bg-step-1-gradient" />
      <QuestionCard
        stepLabel={`STEP 1 / 3 · 현실 조건 (${hardFilterIndex + 1}/${hardFilters.length})`}
        helper={current.helper}
        question={current.question}
      >
        <HardFilterQuestion filter={current} onSelect={advanceWithValue} />
      </QuestionCard>
      <div className="mt-4 flex justify-between">
        <Button variant="ghost" onClick={() => router.push('/')}>처음으로</Button>
        <Button
          variant="ghost"
          onClick={() => {
            const fallback = current.options[0];
            advanceWithValue(fallback.value);
          }}
        >
          건너뛰기 →
        </Button>
      </div>
      <div className="mt-4">
        <Button variant="ghost" onClick={() => setHardFilterIndex(Math.max(hardFilterIndex - 1, 0))} disabled={hardFilterIndex === 0}>
          이전 질문
        </Button>
      </div>
    </main>
  );
}
