'use client';

import { SessionProvider } from 'next-auth/react';
import { UIProvider } from '@/contexts/UIContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UIProvider>
        {children}
      </UIProvider>
    </SessionProvider>
  );
}
