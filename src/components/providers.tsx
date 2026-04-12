'use client';

import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#f8fafc',
            border: '1px solid #1e293b'
          }
        }}
      />
    </>
  );
}
