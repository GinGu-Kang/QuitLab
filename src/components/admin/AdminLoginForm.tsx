'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@local.dev');
  const [password, setPassword] = useState('admin1234!');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '로그인에 실패했습니다.');
      }
      toast.success('관리자 로그인 완료');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[24px] border border-quiz-border bg-quiz-card p-8">
      <h1 className="text-3xl font-bold">관리자 로그인</h1>
      <p className="mt-3 text-sm leading-7 text-quiz-text-secondary">
        로컬 개발 환경에서는 `admin@local.dev / admin1234!` 기본 계정을 사용할 수 있습니다.
      </p>
      <div className="mt-6 space-y-3">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      <Button type="submit" variant="primary" full className="mt-5" disabled={loading}>
        {loading ? '확인 중...' : '로그인'}
      </Button>
    </form>
  );
}
