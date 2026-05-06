'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUpdateUserState } from '@/lib/queries/admin';

interface Props {
  userId: string;
  isBlocked: boolean;
  role: 'user' | 'admin';
  isSelf: boolean;
}

export function UserActions({ userId, isBlocked, role, isSelf }: Props) {
  const t = useTranslations('admin.users');
  const router = useRouter();
  const update = useUpdateUserState();
  const [pending, startTransition] = useTransition();

  const apply = async (patch: { isBlocked?: boolean; role?: 'user' | 'admin' }) => {
    try {
      await update.mutateAsync({ userId, patch });
      toast.success(t('toast.saved'));
      startTransition(() => router.refresh());
    } catch {
      toast.error(t('toast.failed'));
    }
  };

  const busy = update.isPending || pending;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || isSelf}
        onClick={() => apply({ isBlocked: !isBlocked })}
      >
        {isBlocked ? t('actions.unblock') : t('actions.block')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || isSelf}
        onClick={() => apply({ role: role === 'admin' ? 'user' : 'admin' })}
      >
        {role === 'admin' ? t('actions.makeUser') : t('actions.makeAdmin')}
      </Button>
    </div>
  );
}
