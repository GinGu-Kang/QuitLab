'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

export function AdminLogoutButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        router.refresh();
      }}
    >
      로그아웃
    </Button>
  );
}
