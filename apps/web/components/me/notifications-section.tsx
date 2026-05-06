'use client';

import type { UpdateNotificationPreferencesDto } from '@beauty-diary/shared';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/lib/queries/notification-preferences';

type RowKey = 'newFollower' | 'newComment' | 'newLike' | 'newsletter';

export function NotificationsSection() {
  const t = useTranslations('profile.notifications');
  const { data: prefs, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  if (isLoading || !prefs) {
    return (
      <div className="text-foreground-muted flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const toggle = async (key: RowKey, value: boolean) => {
    const patch: UpdateNotificationPreferencesDto = { [key]: value };
    try {
      await update.mutateAsync(patch);
    } catch {
      toast.error(t('saveError'));
    }
  };

  const rows: Array<{ key: RowKey; label: string; hint: string }> = [
    { key: 'newFollower', label: t('newFollower'), hint: t('newFollowerHint') },
    { key: 'newComment', label: t('newComment'), hint: t('newCommentHint') },
    { key: 'newLike', label: t('newLike'), hint: t('newLikeHint') },
    { key: 'newsletter', label: t('newsletter'), hint: t('newsletterHint') },
  ];

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <label
          key={row.key}
          className="border-border flex cursor-pointer items-start justify-between gap-4 border-b py-3 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-medium">{row.label}</p>
            <p className="text-foreground-muted text-xs">{row.hint}</p>
          </div>
          <Switch
            checked={prefs[row.key]}
            disabled={update.isPending}
            onCheckedChange={(v) => toggle(row.key, v === true)}
          />
        </label>
      ))}
    </div>
  );
}
