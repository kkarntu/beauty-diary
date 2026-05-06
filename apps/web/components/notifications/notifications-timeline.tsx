'use client';

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { NotificationRow } from '@/components/notification-row';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationStream,
  useNotifications,
} from '@/lib/queries/notifications';

export function NotificationsTimeline() {
  const t = useTranslations('notifications');
  // Stay subscribed while the page is open — new pushes prepend live.
  useNotificationStream();
  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="text-primary h-6 w-6 shrink-0" />
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-foreground text-2xl font-medium sm:text-3xl"
          >
            {t('title')}
          </h1>
        </div>
        {hasUnread ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            {t('markAllRead')}
          </Button>
        ) : null}
      </header>

      {isLoading ? (
        <div className="text-foreground-muted flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-foreground-muted py-12 text-center">{t('error')}</p>
      ) : items.length === 0 ? (
        <div className="text-foreground-muted space-y-3 px-4 py-16 text-center">
          <BellOff className="mx-auto h-10 w-10" />
          <p className="text-base">{t('empty')}</p>
          <p className="text-sm">{t('emptyHint')}</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {items.map((n) => (
            <li key={n.id}>
              <NotificationRow
                notification={n}
                variant="page"
                onClick={() => {
                  if (!n.readAt) markRead.mutate(n.id);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
