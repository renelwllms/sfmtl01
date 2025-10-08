'use client';

import { SessionProvider } from 'next-auth/react';
import { UIProvider } from '@/contexts/UIContext';
import { ToastProvider } from '@/contexts/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UIProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </UIProvider>
    </SessionProvider>
  );
}
