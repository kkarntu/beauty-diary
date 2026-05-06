import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { routes } from '@/lib/routes';

/**
 * Slim nav for the landing page only — no search, no user menu.
 * Logged-in users still see their own surface elsewhere; landing keeps
 * the chrome quiet so the hero stays the focal point.
 */
export function MarketingNav() {
  const t = useTranslations('navigation');

  return (
    <nav className="bg-surface/95 border-border sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href={routes.home}>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-foreground hover:text-primary cursor-pointer text-xl font-semibold transition-colors md:text-2xl"
            >
              Beauty Diary
            </h1>
          </Link>

          <div className="flex items-center gap-2">
            <Link href={routes.feed}>
              <Button variant="ghost" size="sm">
                {t('feed')}
              </Button>
            </Link>
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />
            <div className="hidden items-center gap-2 sm:flex">
              <Link href={routes.login}>
                <Button variant="ghost" size="sm">
                  {t('signIn')}
                </Button>
              </Link>
              <Link href={routes.register}>
                <Button size="sm">{t('signUp')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
