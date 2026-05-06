'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRetryOutbox } from '@/lib/queries/admin-outbox';

export function OutboxRetryButton({ id }: { id: string }) {
  const t = useTranslations('admin.outbox');
  const router = useRouter();
  const retry = useRetryOutbox();
  const [pending, startTransition] = useTransition();

  const onClick = async () => {
    try {
      await retry.mutateAsync(id);
      toast.success(t('requeued'));
      startTransition(() => router.refresh());
    } catch {
      toast.error(t('retryFailed'));
    }
  };

  const busy = retry.isPending || pending;
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={busy}>
      {busy ? t('saving') : t('retry')}
    </Button>
  );
}
