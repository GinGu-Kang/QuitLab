'use client';

import toast from 'react-hot-toast';

import { recordEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';

export function ShareButtons({ sessionId, topItem }: { sessionId: string; topItem: string }) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('링크가 복사되었어요!');
    await recordEvent('share_click_copy', sessionId, { item: topItem });
  };

  const handleKakao = async () => {
    await navigator.clipboard.writeText(`퇴사하면 나는 ${topItem}이 딱이래 🤔 너는 뭐 나오는지 해봐 ${window.location.href}`);
    toast.success('공유 문구를 복사했어요!');
    await recordEvent('share_click_kakao', sessionId, { item: topItem });
  };

  return (
    <div className="rounded-[18px] border border-quiz-border bg-quiz-card p-5">
      <p className="text-xs text-quiz-text-dim">이 결과, 친구 의견도 들어볼까요?</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button variant="gold" full onClick={handleCopy}>
          📸 결과 공유하기
        </Button>
        <Button full onClick={handleKakao}>
          💬 카카오톡으로 보내기
        </Button>
      </div>
    </div>
  );
}
