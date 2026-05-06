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
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-20">
        <div className="flex items-center justify-between h-16 gap-3">
          <Link href={routes.feed}>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-xl md:text-2xl font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
            >
              Beauty Diary
            </h1>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center relative">
              <Search className="absolute left-3 w-4 h-4 text-foreground-muted pointer-events-none z-10" />
              <Link href={routes.search} className="w-full">
                <Input
                  placeholder={t('searchPlaceholder')}
                  className="pl-9 w-64 bg-surface-muted border-0 focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
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
                <PenSquare className="w-5 h-5" />
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
