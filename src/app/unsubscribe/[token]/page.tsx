import { notFound } from 'next/navigation';

import { UnsubscribeClient } from '@/components/unsubscribe/UnsubscribeClient';
import { getContactByToken } from '@/lib/repository';

export default async function UnsubscribePage({ params }: { params: { token: string } }) {
  const contact = await getContactByToken(params.token);
  if (!contact) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[620px] items-center justify-center px-4">
      <div className="rounded-[24px] border border-quiz-border bg-quiz-card p-8">
        <h1 className="text-3xl font-bold">수신거부 처리</h1>
        <p className="mt-4 text-sm leading-7 text-quiz-text-secondary">
          {contact.email} 주소로 발송되는 창업 정보 메일을 더 이상 받고 싶지 않다면 아래 버튼을 눌러주세요.
        </p>
        <div className="mt-6">
          <UnsubscribeClient token={params.token} />
        </div>
      </div>
    </main>
  );
}
