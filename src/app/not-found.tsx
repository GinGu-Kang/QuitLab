import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-[24px] border border-quiz-border bg-quiz-card p-8 text-center">
        <p className="text-sm font-semibold text-quiz-teal-light">결과를 찾지 못했어요</p>
        <h1 className="mt-3 text-3xl font-bold">요청한 페이지가 없거나 만료됐습니다.</h1>
        <p className="mt-4 text-sm leading-7 text-quiz-text-secondary">
          세션이 유효하지 않거나 아직 생성되지 않았을 수 있습니다. 처음부터 다시 진단해 주세요.
        </p>
        <Link href="/" className="mt-6 inline-block">
          <Button variant="primary">처음으로 돌아가기</Button>
        </Link>
      </div>
    </main>
  );
}
