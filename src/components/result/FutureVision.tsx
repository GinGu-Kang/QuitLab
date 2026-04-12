import type { MatchResult } from '@/types';

export function FutureVision({ name, topResult }: { name: string; topResult: MatchResult }) {
  const year = new Date().getFullYear() + 10;

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.08)] p-5">
        <p className="text-sm leading-7 text-purple-100">💭 진지한 분석은 위 탭에서 다 봤죠? 여기서는 잠깐 상상해봐요.</p>
      </div>

      <div className="rounded-[24px] border border-quiz-border bg-gradient-to-br from-[rgba(13,148,136,0.18)] via-[rgba(139,92,246,0.18)] to-[rgba(236,72,153,0.14)] p-6">
        <p className="text-sm font-semibold text-quiz-text-secondary">— {year}년 —</p>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-quiz-teal to-quiz-purple text-2xl font-bold">
            👤
          </div>
          <div>
            <h3 className="text-2xl font-bold">{name} 대표</h3>
            <p className="mt-1 text-sm text-quiz-text-secondary">
              {topResult.item.name} · {topResult.item.category}
            </p>
          </div>
        </div>
        <blockquote className="mt-6 rounded-[18px] bg-[rgba(15,23,42,0.55)] p-5 text-sm leading-8 text-quiz-text-secondary">
          &quot;{topResult.item.name} 일이 적성에 맞아서, 매일 현장에 나가는 게 즐거워요. 고객과 쌓인 신뢰가 결국 가장 큰 자산이 되더라고요.&quot;
          <footer className="mt-3 text-xs text-quiz-text-dim">— {year}년 {name} 대표 인터뷰 中</footer>
        </blockquote>
      </div>
    </div>
  );
}
