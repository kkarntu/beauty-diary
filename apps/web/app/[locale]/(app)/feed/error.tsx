'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function FeedError({ reset }: { reset: () => void }) {
  const t = useTranslations('feed.error');

  return (
    <div className="mx-auto max-w-md space-y-4 px-6 py-20 text-center">
      <div className="bg-destructive/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
        <AlertTriangle className="text-destructive h-6 w-6" />
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium">
        {t('title')}
      </h2>
      <p className="text-foreground-muted">{t('subtitle')}</p>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}
