'use client';

import { useEffect } from 'react';
import competencyQuestionsJson from '@/data/competency-questions.json';
import { useRouter } from 'next/navigation';

import { OptionButton } from '@/components/diagnose/OptionButton';
import { QuestionCard } from '@/components/diagnose/QuestionCard';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { recordEvent } from '@/lib/analytics';
import { useDiagnoseStore } from '@/store/diagnose-store';
import type { CompetencyQuestion } from '@/types';

const questions = competencyQuestionsJson as CompetencyQuestion[];

export default function Step2Page() {
  const router = useRouter();
  const {
    trackingId,
    hardFilter,
    competencyIndex,
    setCompetencyAnswer,
    nextCompetency,
    setCompetencyIndex,
    setCurrentStep
  } = useDiagnoseStore();

  useEffect(() => {
    setCurrentStep(2);
    if (Object.keys(hardFilter).length === 0) {
      router.replace('/diagnose/step-1');
    }
  }, [hardFilter, router, setCurrentStep]);

  const current = questions[competencyIndex];
  if (!current) {
    router.replace('/diagnose/step-3');
    return null;
  }

  function advance(score: number) {
    setCompetencyAnswer(competencyIndex, score);
    if (competencyIndex === questions.length - 1) {
      void recordEvent('step2_complete', trackingId);
      router.push('/diagnose/step-3');
      return;
    }
    nextCompetency();
  }

  return (
    <main id="main-content" className="animate-fade-up mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
      <ProgressBar total={questions.length} current={competencyIndex} gradientClassName="bg-step-2-gradient" />
      <QuestionCard stepLabel={`STEP 2 / 3 · 역량 진단 (${competencyIndex + 1}/${questions.length})`} question={current.scenario}>
        {current.options.map((option) => (
          <OptionButton
            key={`${current.id}_${option.score}`}
            title={option.text}
            subtitle={`${option.score}점 선택`}
            onClick={() => advance(option.score)}
          />
        ))}
      </QuestionCard>
      <div className="mt-4 flex justify-between">
        <Button variant="ghost" onClick={() => setCompetencyIndex(Math.max(competencyIndex - 1, 0))} disabled={competencyIndex === 0}>
          이전 질문
        </Button>
        <Button variant="ghost" onClick={() => advance(3)}>
          건너뛰기 →
        </Button>
      </div>
    </main>
  );
}
