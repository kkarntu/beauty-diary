'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface Props {
  email: string;
}

export function AccountSection({ email }: Props) {
  const t = useTranslations('profile');

  const requestReset = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/password/request-reset', { email });
    },
    onSuccess: () => {
      toast.success(t('account.resetSent'));
    },
    onError: () => {
      toast.error(t('account.resetFailed'));
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="block text-sm font-medium text-foreground mb-2">{t('email.label')}</p>
        <p className="text-foreground-muted mb-2">{email}</p>
        <p className="text-xs text-foreground-muted">{t('account.emailHint')}</p>
      </div>

      <div className="border-t border-border pt-6">
        <p className="block text-sm font-medium text-foreground mb-2">
          {t('account.changePassword')}
        </p>
        <p className="text-xs text-foreground-muted mb-3">{t('account.passwordHint')}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => requestReset.mutate()}
          disabled={requestReset.isPending}
        >
          {requestReset.isPending ? t('account.sendingReset') : t('account.changePassword')}
        </Button>
      </div>
    </div>
  );
}
