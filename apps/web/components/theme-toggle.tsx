'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export function ThemeToggle({ className }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('themeToggle');
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render a placeholder until the client knows
  // which theme is active.
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('switchToLight') : t('switchToDark')}
      className={cn(
        'border-border bg-surface text-foreground hover:bg-surface-muted inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
        className,
      )}
    >
      {/* Render Moon by default so the icon is visible during hydration —
          avoids the empty-square flicker. After mount the icon swaps to
          match the actual resolved theme. */}
      {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
