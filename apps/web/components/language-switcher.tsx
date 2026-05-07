'use client';

import { Check, Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';

interface Props {
  className?: string;
}

const LOCALES: ReadonlyArray<{ code: Locale; label: string; short: string }> = [
  { code: 'uk', label: 'Українська', short: 'УК' },
  { code: 'en', label: 'English', short: 'EN' },
];

export function LanguageSwitcher({ className }: Props) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('languageSwitcher');
  const [isPending, startTransition] = useTransition();

  const active = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]!;

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('label')}
          disabled={isPending}
          className={cn(
            'text-foreground-muted hover:text-foreground gap-1.5 px-2.5',
            className,
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wide">{active.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LOCALES.map((l) => {
          const isActive = l.code === locale;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => switchTo(l.code)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2',
                isActive && 'bg-surface-muted',
              )}
            >
              <span className="flex flex-col">
                <span
                  className={cn(
                    'text-sm',
                    isActive ? 'text-foreground font-medium' : 'text-foreground-muted',
                  )}
                >
                  {l.label}
                </span>
                <span className="text-foreground-muted text-[11px] tracking-wide uppercase">
                  {l.short}
                </span>
              </span>
              {isActive ? <Check className="text-primary h-4 w-4" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
