'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AdBanner } from '@/components/AdBanner';
import { Button } from '@/components/ui/Button';
import { recordEvent } from '@/lib/analytics';

export function AdPageClient({ sid }: { sid?: string }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(15);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!sid) {
      router.replace('/');
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setDone(true);
          void recordEvent('ad_watched', sid);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [router, sid]);

  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col items-center justify-center px-4">
      <div className="w-full rounded-lg border border-quiz-border bg-quiz-card p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-quiz-text-dim">Advertisement</p>
        <div className="mt-5 rounded-lg bg-quiz-bg/70 p-6">
          <div className="h-[180px] rounded-md bg-quiz-bg/80 p-4">
            <AdBanner compact />
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-quiz-text-secondary">
          {done ? '분석 결과를 확인할 준비가 끝났어요.' : `결과를 보려면 ${seconds}초 기다려주세요.`}
        </p>
        <Button variant="gold" full className="mt-6" disabled={!done} onClick={() => sid && router.push(`/result/${sid}`)}>
          📊 분석 결과 확인하기
        </Button>
      </div>
    </main>
  );
}
