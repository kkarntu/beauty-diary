import { FileX } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

export default async function PostNotFound() {
  const t = await getTranslations('postDetail.notFound');
  return (
    <div className="mx-auto max-w-md space-y-4 px-6 py-20 text-center">
      <div className="bg-surface-muted mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <FileX className="text-foreground-muted h-6 w-6" />
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium">
        {t('title')}
      </h2>
      <p className="text-foreground-muted">{t('subtitle')}</p>
      <Button asChild>
        <Link href={routes.feed}>{t('backToFeed')}</Link>
      </Button>
    </div>
  );
}
