'use client';

import { SessionProvider } from 'next-auth/react';
import { UIProvider } from '@/contexts/UIContext';
import { ToastProvider } from '@/contexts/ToastContext';
import LayoutWrapper from '@/components/LayoutWrapper';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UIProvider>
        <ToastProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ToastProvider>
      </UIProvider>
    </SessionProvider>
  );
}
