import { getTranslations } from 'next-intl/server';

export async function SkipToContent() {
  const t = await getTranslations('navigation');
  return (
    <a
      href="#main-content"
      className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:shadow-lg"
    >
      {t('skipToContent')}
    </a>
  );
}
