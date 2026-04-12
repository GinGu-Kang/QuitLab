'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

import { recordEvent } from '@/lib/analytics';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function EmailCollector({ sessionId }: { sessionId: string }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    privacyConsent: false,
    marketingConsent: false
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...form,
          privacyConsent: form.privacyConsent
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '결과 저장에 실패했습니다.');
      }

      toast.success('결과를 이메일로 보내드렸어요!');
      await recordEvent('email_submit', sessionId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[18px] border border-quiz-border bg-quiz-card p-5">
      <h3 className="text-lg font-bold">📧 분석 결과 저장하기</h3>
      <p className="mt-2 text-sm leading-7 text-quiz-text-secondary">
        이 페이지를 닫으면 다시 보기 어려워요. 나중에 천천히 다시 보고 싶다면 이메일로 받아두세요.
      </p>

      <div className="mt-4 space-y-3">
        <Input
          placeholder="이름"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <Input
          placeholder="이메일"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
        <Input
          placeholder="전화번호"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
        />
      </div>

      <div className="mt-4 space-y-3 text-sm text-quiz-text-secondary">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 accent-quiz-teal"
            checked={form.privacyConsent}
            onChange={(event) => setForm((prev) => ({ ...prev, privacyConsent: event.target.checked }))}
          />
          <span>
            (필수) 개인정보 수집 및 이용에 동의합니다 <a href="/privacy" className="text-quiz-teal-light underline">전문 보기</a>
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 accent-quiz-teal"
            checked={form.marketingConsent}
            onChange={(event) => setForm((prev) => ({ ...prev, marketingConsent: event.target.checked }))}
          />
          <span>
            (선택) 창업 관련 유용한 정보를 받아보겠습니다 <a href="/terms" className="text-quiz-teal-light underline">전문 보기</a>
          </span>
        </label>
      </div>

      <Button type="submit" variant="primary" full className="mt-5" disabled={submitting}>
        {submitting ? '전송 중...' : '결과 받기'}
      </Button>
    </form>
  );
}
