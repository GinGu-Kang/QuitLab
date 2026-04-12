import Link from 'next/link';

import { listCustomers } from '@/lib/repository';

type CustomerRow = {
  id?: string;
  email: string;
  name: string;
  privacyConsent?: boolean;
  marketingConsent?: boolean;
  createdAt: string;
};

export default async function AdminCustomersPage({
  searchParams
}: {
  searchParams?: { q?: string; marketing?: string };
}) {
  const query = searchParams?.q || '';
  const marketingOnly = searchParams?.marketing === '1';
  const customers = (await listCustomers({ query, marketingOnly })) as CustomerRow[];
  const csvUrl = '/api/admin/export';

  return (
    <div className="rounded-[24px] border border-quiz-border bg-quiz-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">고객 DB</h2>
          <p className="mt-2 text-sm text-quiz-text-secondary">이름 또는 이메일로 검색하고, 마케팅 동의 여부로 필터링할 수 있습니다.</p>
        </div>
        <Link href={csvUrl} className="text-sm text-quiz-gold-light underline">
          CSV 내보내기
        </Link>
      </div>

      <form className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="이름 또는 이메일 검색"
          className="min-h-11 rounded-[14px] border border-quiz-border bg-quiz-bg px-4 py-3 text-sm"
        />
        <label className="flex min-h-11 items-center gap-2 rounded-[14px] border border-quiz-border bg-quiz-bg px-4 text-sm text-quiz-text-secondary">
          <input type="checkbox" name="marketing" value="1" defaultChecked={marketingOnly} className="accent-quiz-teal" />
          마케팅 동의만
        </label>
        <button type="submit" className="min-h-11 rounded-[14px] bg-quiz-teal px-4 text-sm font-semibold text-white">
          적용
        </button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-quiz-text-dim">
            <tr>
              <th className="border-b border-quiz-border px-3 py-3">이름</th>
              <th className="border-b border-quiz-border px-3 py-3">이메일</th>
              <th className="border-b border-quiz-border px-3 py-3">개인정보 동의</th>
              <th className="border-b border-quiz-border px-3 py-3">마케팅 동의</th>
              <th className="border-b border-quiz-border px-3 py-3">가입일</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id || customer.email} className="text-quiz-text-secondary">
                <td className="border-b border-quiz-border px-3 py-3">{customer.name}</td>
                <td className="border-b border-quiz-border px-3 py-3">{customer.email}</td>
                <td className="border-b border-quiz-border px-3 py-3">{customer.privacyConsent ? '동의' : '-'}</td>
                <td className="border-b border-quiz-border px-3 py-3">{customer.marketingConsent ? '동의' : '미동의'}</td>
                <td className="border-b border-quiz-border px-3 py-3">{customer.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
