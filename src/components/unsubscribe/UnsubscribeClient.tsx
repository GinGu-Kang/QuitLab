'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';

export function UnsubscribeClient({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const response = await fetch(`/api/unsubscribe/${token}`, { method: 'POST' });
      if (!response.ok) throw new Error('수신거부 처리에 실패했습니다.');
      setDone(true);
      toast.success('수신거부가 완료되었습니다.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '수신거부 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <p className="mt-4 text-sm text-quiz-text-secondary">수신거부가 완료되었습니다.</p>;
  }

  return (
    <Button variant="gold" onClick={handleConfirm} disabled={loading}>
      {loading ? '처리 중...' : '수신거부 확인'}
    </Button>
  );
}
