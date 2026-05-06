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
    <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-20">
        <div className="flex items-center justify-between h-16 gap-3">
          <Link href={routes.home}>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-xl md:text-2xl font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
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
            <div className="hidden sm:flex items-center gap-2">
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
