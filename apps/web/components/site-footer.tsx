import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function SiteFooter() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-20 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2 space-y-3">
          <Link href={routes.home}>
            <span
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
            >
              Beauty Diary
            </span>
          </Link>
          <p className="text-sm text-foreground-muted max-w-md">{t('tagline')}</p>
        </div>

        <div className="space-y-3">
          <h4
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-base font-medium text-foreground"
          >
            {t('explore')}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={routes.feed} className="text-foreground-muted hover:text-primary">
                {t('links.feed')}
              </Link>
            </li>
            <li>
              <Link
                href={routes.category('skincare')}
                className="text-foreground-muted hover:text-primary"
              >
                {t('links.skincare')}
              </Link>
            </li>
            <li>
              <Link
                href={routes.category('wellness')}
                className="text-foreground-muted hover:text-primary"
              >
                {t('links.wellness')}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-base font-medium text-foreground"
          >
            {t('account')}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={routes.login} className="text-foreground-muted hover:text-primary">
                {t('links.signIn')}
              </Link>
            </li>
            <li>
              <Link
                href={routes.register}
                className="text-foreground-muted hover:text-primary"
              >
                {t('links.signUp')}
              </Link>
            </li>
            <li>
              <Link href={routes.newPost} className="text-foreground-muted hover:text-primary">
                {t('links.write')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-20 py-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="caption text-foreground-muted">
            © {year} Beauty Diary. {t('copyright')}
          </p>
          <p className="caption text-foreground-muted">{t('madeWith')}</p>
        </div>
      </div>
    </footer>
  );
}
