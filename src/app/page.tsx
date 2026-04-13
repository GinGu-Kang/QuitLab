'use client';

import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { recordEvent } from '@/lib/analytics';
import { useDiagnoseStore } from '@/store/diagnose-store';

export default function LandingPage() {
  const router = useRouter();
  const { reset, trackingId } = useDiagnoseStore();

  useEffect(() => {
    void recordEvent('landing_view', trackingId);
  }, [trackingId]);

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-5 py-12">
      <div className="mx-auto w-full max-w-[540px] text-center">
        {/* Badge */}
        <div className="animate-fade-up inline-flex rounded-md border border-quiz-border bg-quiz-card/60 px-4 py-2 text-[13px] font-medium text-quiz-text-secondary">
          3분 무료 진단 · 로그인 불필요
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-delay-1 mt-8 text-[40px] font-black leading-[1.2] tracking-tight sm:text-[52px]">
          <span className="block text-quiz-text">퇴사하면 나는</span>
          <span className="block bg-hero-gradient bg-clip-text text-transparent">
            어떤 사장님이 될까?
          </span>
        </h1>

        {/* Description */}
        <p className="animate-fade-up-delay-2 mx-auto mt-6 max-w-[420px] text-[16px] leading-[1.8] text-quiz-text-secondary">
          12개 역량 진단, 10개 성향 분석, 현실 조건 필터까지.
          <br />
          129개 업종 중 나에게 맞는 창업 아이템 TOP 5를 찾아드립니다.
        </p>

        {/* CTA */}
        <div className="animate-fade-up-delay-3 mt-10">
          <Button
            variant="primary"
            className="px-8 py-4 text-[16px]"
            onClick={() => {
              reset();
              router.push('/diagnose/step-1');
            }}
          >
            내 운명 가게 찾기 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="animate-fade-up-delay-3 mt-8 flex items-center justify-center gap-6 text-[13px] text-quiz-text-dim">
          <span>12개 역량 진단</span>
          <span className="h-3 w-px bg-quiz-border" />
          <span>129개 업종 분석</span>
          <span className="h-3 w-px bg-quiz-border" />
          <span>현실 비용 · 수익 포함</span>
        </div>

        {/* Social proof */}
        <p className="mt-12 text-[13px] text-quiz-text-dim/60">
          퇴사를 고민하는 직장인이라면, 3분만 투자하세요.
        </p>
      </div>
    </main>
  );
}
