'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useDiagnoseStore } from '@/store/diagnose-store';

const steps = [
  '129개 업종과 당신의 조건을 대조 중...',
  '역량 적합도 계산 중...',
  '성향 매칭 중...',
  '10년 후 미래 시뮬레이션 중...',
  '찾았습니다!'
];

export default function LoadingPage() {
  const router = useRouter();
  const started = useRef(false);
  const startedAt = useRef<number>(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [requestDone, setRequestDone] = useState(false);
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null);
  const { getDiagnoseInput, setLastSessionId } = useDiagnoseStore();

  const input = useMemo(() => getDiagnoseInput(), [getDiagnoseInput]);

  useEffect(() => {
    if (!input || started.current) {
      if (!input) router.replace('/diagnose/step-1');
      return;
    }

    started.current = true;
    startedAt.current = Date.now();

    const timer = window.setInterval(() => {
      setStepIndex((current) => (current < steps.length - 1 ? current + 1 : current));
    }, 1000);

    void fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || '분석에 실패했습니다.');
        }
        setLastSessionId(payload.sessionId);
        setResolvedSessionId(payload.sessionId);
        setRequestDone(true);
      })
      .catch(() => {
        router.replace('/diagnose/step-1');
      });

    return () => window.clearInterval(timer);
  }, [input, router, setLastSessionId]);

  useEffect(() => {
    if (requestDone && resolvedSessionId) {
      const elapsed = Date.now() - startedAt.current;
      const minimumLoadingMs = 4600;
      const remaining = Math.max(0, minimumLoadingMs - elapsed);
      const timeout = window.setTimeout(() => {
        window.location.replace(`/ad?sid=${resolvedSessionId}`);
      }, remaining);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [requestDone, resolvedSessionId]);

  return (
    <main id="main-content" className="animate-fade-up mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full border border-quiz-border bg-quiz-card p-5">
        <Loader2 className="h-10 w-10 animate-spin text-quiz-teal-light" />
      </div>
      <h1 className="mt-6 text-3xl font-bold">분석 중입니다</h1>
      <p aria-live="polite" className="mt-3 max-w-md text-sm leading-7 text-quiz-text-secondary">{steps[stepIndex]}</p>
      <div className="mt-8 w-full max-w-sm space-y-2">
        {steps.map((text, index) => (
          <div
            key={text}
            className={`rounded-full px-4 py-2 text-sm ${index <= stepIndex ? 'bg-[rgba(20,184,166,0.14)] text-quiz-teal-light' : 'bg-quiz-card text-quiz-text-dim'}`}
          >
            {text}
          </div>
        ))}
      </div>
    </main>
  );
}
