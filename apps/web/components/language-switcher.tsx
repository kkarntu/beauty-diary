'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

interface Props {
  className?: string;
}

export function LanguageSwitcher({ className }: Props) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('languageSwitcher');
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-surface text-sm overflow-hidden',
        className,
      )}
      role="group"
      aria-label={t('label')}
    >
      {(['uk', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => switchTo(code)}
          disabled={isPending}
          aria-pressed={locale === code}
          className={cn(
            'px-3 h-9 font-medium transition-colors uppercase',
            locale === code
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground-muted hover:text-foreground hover:bg-surface-muted',
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
