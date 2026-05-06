import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export function SiteFooter() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-surface border-t">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-12 md:grid-cols-4 lg:px-20">
        <div className="space-y-3 md:col-span-2">
          <Link href={routes.home}>
            <span
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-foreground hover:text-primary text-xl font-semibold transition-colors"
            >
              Beauty Diary
            </span>
          </Link>
          <p className="text-foreground-muted max-w-md text-sm">{t('tagline')}</p>
        </div>

        <div className="space-y-3">
          <h4
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-foreground text-base font-medium"
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
            className="text-foreground text-base font-medium"
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
              <Link href={routes.register} className="text-foreground-muted hover:text-primary">
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

      <div className="border-border border-t">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-2 px-6 py-6 md:flex-row lg:px-20">
          <p className="caption text-foreground-muted">
            © {year} Beauty Diary. {t('copyright')}
          </p>
          <p className="caption text-foreground-muted">{t('madeWith')}</p>
        </div>
      </div>
    </footer>
  );
}
