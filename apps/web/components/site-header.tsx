'use client';

import { PenSquare, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { MobileMenu } from '@/components/mobile-menu';
import { NotificationsBell } from '@/components/notifications-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { routes } from '@/lib/routes';

export function SiteHeader() {
  const t = useTranslations('navigation');

  return (
    <nav className="bg-surface/95 border-border sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href={routes.feed}>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-foreground hover:text-primary cursor-pointer text-xl font-semibold transition-colors md:text-2xl"
            >
              Beauty Diary
            </h1>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative hidden items-center lg:flex">
              <Search className="text-foreground-muted pointer-events-none absolute left-3 z-10 h-4 w-4" />
              <Link href={routes.search} className="w-full">
                <Input
                  placeholder={t('searchPlaceholder')}
                  className="bg-surface-muted focus-visible:ring-ring w-64 cursor-pointer border-0 pl-9 focus-visible:ring-1"
                  readOnly
                />
              </Link>
            </div>

            {/* Always rendered to avoid hydration shift when useCurrentUser
                resolves. Anonymous users get bumped to /login by middleware. */}
            <Link href={routes.newPost}>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground-muted hover:text-foreground"
                aria-label={t('newPost')}
              >
                <PenSquare className="h-5 w-5" />
              </Button>
            </Link>

            <NotificationsBell />
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />

            <div className="hidden md:block">
              <UserMenu />
            </div>

            <div className="lg:hidden">
              <MobileMenu />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
