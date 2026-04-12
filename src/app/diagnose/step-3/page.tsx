'use client';

import { useEffect } from 'react';
import personalityQuestionsJson from '@/data/personality-questions.json';
import { useRouter } from 'next/navigation';

import { BinaryChoice } from '@/components/diagnose/BinaryChoice';
import { QuestionCard } from '@/components/diagnose/QuestionCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { recordEvent } from '@/lib/analytics';
import { useDiagnoseStore } from '@/store/diagnose-store';
import type { PersonalityQuestion } from '@/types';

const questions = personalityQuestionsJson as PersonalityQuestion[];

export default function Step3Page() {
  const router = useRouter();
  const {
    trackingId,
    competencyAnswers,
    personalityIndex,
    setPersonalityAnswer,
    nextPersonality,
    setPersonalityIndex,
    setCurrentStep,
    name,
    setName
  } = useDiagnoseStore();

  useEffect(() => {
    setCurrentStep(3);
    if (competencyAnswers.every((entry) => entry == null)) {
      router.replace('/diagnose/step-2');
    }
  }, [competencyAnswers, router, setCurrentStep]);

  const current = questions[personalityIndex];

  function advance(choice: 'a' | 'b') {
    setPersonalityAnswer(personalityIndex, choice);
    if (personalityIndex === questions.length - 1) {
      void recordEvent('step3_complete', trackingId);
      nextPersonality();
      return;
    }
    nextPersonality();
  }

  const finished = personalityIndex >= questions.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center px-4 py-8">
      {!finished && (
        <>
          <ProgressBar total={questions.length} current={personalityIndex} gradientClassName="bg-step-3-gradient" />
          <QuestionCard
            stepLabel={`STEP 3 / 3 · 성향·가치관 (${personalityIndex + 1}/${questions.length})`}
            helper="'할 수 있느냐'가 아닌 '하고 싶은가'를 묻습니다"
            question={current.question}
          >
            <BinaryChoice
              left={{
                text: current.choiceA.text,
                icon: current.choiceA.icon,
                onClick: () => advance('a')
              }}
              right={{
                text: current.choiceB.text,
                icon: current.choiceB.icon,
                onClick: () => advance('b')
              }}
            />
          </QuestionCard>
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={() => setPersonalityIndex(Math.max(personalityIndex - 1, 0))} disabled={personalityIndex === 0}>
              이전 질문
            </Button>
            <Button variant="ghost" onClick={() => advance('a')}>
              건너뛰기 →
            </Button>
          </div>
        </>
      )}

      {finished && (
        <div className="rounded-[22px] border border-quiz-border bg-quiz-card p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(139,92,246,0.14)] text-3xl">✨</div>
          <h2 className="mt-4 text-2xl font-bold">모든 진단 완료!</h2>
          <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">결과 페이지에 표시할 닉네임을 정해 주세요. 비워두면 기본값 &quot;도전자&quot;를 사용합니다.</p>
          <Input
            className="mt-5 text-center"
            maxLength={10}
            placeholder="닉네임 입력"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button variant="primary" full className="mt-5" onClick={() => router.push('/diagnose/loading')}>
            분석 결과 보기 →
          </Button>
          <Button variant="ghost" full className="mt-2" onClick={() => { setName('도전자'); router.push('/diagnose/loading'); }}>
            건너뛰기
          </Button>
        </div>
      )}
    </main>
  );
}
