'use client';

import { useEffect } from 'react';
import { ArrowRight, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { SectionCard } from '@/components/ui/SectionCard';
import { recordEvent } from '@/lib/analytics';
import { useDiagnoseStore } from '@/store/diagnose-store';

const features = [
  { title: '현실성 있는 필터', desc: '자본금, 퇴사 시기, 가족 상황까지 먼저 반영합니다.' },
  { title: '129개 업종 비교', desc: '엑셀 원본 DB를 바탕으로 전체 업종을 동시에 분석합니다.' },
  { title: '실행 가이드 포함', desc: '추천에서 끝나지 않고 리스크와 준비 순서까지 보여줍니다.' }
];

export default function LandingPage() {
  const router = useRouter();
  const { reset, trackingId } = useDiagnoseStore();

  useEffect(() => {
    void recordEvent('landing_view', trackingId);
  }, [trackingId]);

  return (
    <main className="px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1100px] flex-col justify-center gap-6 lg:flex-row lg:items-center">
        <SectionCard className="flex-1 border-white/5 bg-[linear-gradient(160deg,rgba(20,184,166,0.12),rgba(15,23,42,0.92),rgba(245,158,11,0.08))] p-8 sm:p-10">
          <div className="inline-flex rounded-full border border-[rgba(20,184,166,0.25)] bg-[rgba(20,184,166,0.08)] px-4 py-2 text-sm font-semibold text-quiz-teal-light">
            <Sparkles className="mr-2 h-4 w-4" />
            퇴사 고민 직장인을 위한 3분 진단
          </div>
          <div className="mt-6 text-5xl font-black leading-tight sm:text-6xl">
            <span className="block">퇴사하면 나는</span>
            <span className="block bg-hero-gradient bg-clip-text text-transparent">어떤 가게 사장님?</span>
          </div>
          <p className="mt-5 max-w-2xl text-lg leading-9 text-quiz-text-secondary">
            12개 역량과 129개 업종, 현실 조건을 교차 분석해서 지금 당장 해볼 만한 창업 아이템 TOP 5를 찾아드립니다.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-quiz-text-dim">
            <span className="rounded-full border border-quiz-border px-3 py-1.5">⏱️ 3분</span>
            <span className="rounded-full border border-quiz-border px-3 py-1.5">로그인 불필요</span>
            <span className="rounded-full border border-quiz-border px-3 py-1.5">현실 비용 · 수익 · 가이드</span>
          </div>
          <div className="mt-8">
            <Button
              variant="primary"
              onClick={() => {
                reset();
                router.push('/diagnose/step-1');
              }}
            >
              내 운명 가게 찾기 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </SectionCard>

        <div className="w-full max-w-[380px] space-y-4">
          {features.map((feature) => (
            <SectionCard key={feature.title}>
              <h2 className="text-lg font-bold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">{feature.desc}</p>
            </SectionCard>
          ))}
          <SectionCard className="bg-quiz-card/80">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-quiz-green" />
              <div>
                <h2 className="text-lg font-bold">현실 기준 우선</h2>
                <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">
                  폐업률, 경쟁강도, 필요한 인력까지 같이 봅니다. 꿈만 보여주는 테스트가 아니라 실행 가능성까지 확인합니다.
                </p>
              </div>
            </div>
          </SectionCard>
          <SectionCard className="bg-quiz-card/80">
            <div className="flex items-start gap-3">
              <BarChart3 className="mt-1 h-5 w-5 text-quiz-gold-light" />
              <div>
                <h2 className="text-lg font-bold">분석 근거 공개</h2>
                <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">
                  결과 페이지에서 왜 추천됐는지, 어떤 역량이 부족한지, 무엇부터 보완해야 하는지까지 한 번에 볼 수 있습니다.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
