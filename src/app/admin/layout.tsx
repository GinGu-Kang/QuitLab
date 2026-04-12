import Link from 'next/link';

import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton';
import { getAdminSession } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = getAdminSession();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <AdminLoginForm />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-quiz-border bg-quiz-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-quiz-teal-light">관리자 모드</p>
          <h1 className="mt-2 text-3xl font-bold">{session.email}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-quiz-text-secondary hover:text-quiz-text">
            대시보드
          </Link>
          <Link href="/admin/customers" className="text-sm text-quiz-text-secondary hover:text-quiz-text">
            고객 목록
          </Link>
          <AdminLogoutButton />
        </div>
      </div>
      {children}
    </main>
  );
}
