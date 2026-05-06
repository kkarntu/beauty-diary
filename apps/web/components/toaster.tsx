'use client';

import { useTheme } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={(resolvedTheme as 'light' | 'dark' | undefined) ?? 'light'}
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-surface border-border text-foreground',
          title: 'text-foreground',
          description: 'text-foreground-muted',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-surface-muted text-foreground',
          closeButton: 'bg-surface-muted text-foreground',
          error: 'bg-destructive text-destructive-foreground',
          success: 'bg-success text-white',
          warning: 'bg-warning text-white',
          info: 'bg-primary text-primary-foreground',
        },
      }}
      richColors
    />
  );
}
