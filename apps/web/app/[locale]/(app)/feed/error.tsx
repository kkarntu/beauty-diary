'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function FeedError({ reset }: { reset: () => void }) {
  const t = useTranslations('feed.error');

  return (
    <div className="mx-auto max-w-md py-20 text-center space-y-4 px-6">
      <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium">
        {t('title')}
      </h2>
      <p className="text-foreground-muted">{t('subtitle')}</p>
      <Button onClick={reset}>{t('retry')}</Button>
    </div>
  );
}
