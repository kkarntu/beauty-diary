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

const ROW_KEYS = ['newFollower', 'newComment', 'newLike', 'newsletter'] as const;
type RowKey = (typeof ROW_KEYS)[number];

export function NotificationsSection() {
  const t = useTranslations('profile.notifications');
  const { data: prefs, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  if (isLoading || !prefs) {
    return (
      <div className="py-12 flex items-center justify-center text-foreground-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
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
          className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-b-0 cursor-pointer"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{row.label}</p>
            <p className="text-xs text-foreground-muted">{row.hint}</p>
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
