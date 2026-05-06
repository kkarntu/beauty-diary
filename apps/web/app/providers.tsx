'use client';

import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/query-provider';
import { SocketProvider } from '@/lib/realtime/socket-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SocketProvider>{children}</SocketProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
