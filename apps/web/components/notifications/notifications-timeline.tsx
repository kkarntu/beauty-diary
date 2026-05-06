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
      <header className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary shrink-0" />
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-2xl sm:text-3xl font-medium text-foreground"
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
        <div className="py-12 flex items-center justify-center text-foreground-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-foreground-muted">{t('error')}</p>
      ) : items.length === 0 ? (
        <div className="py-16 px-4 text-center space-y-3 text-foreground-muted">
          <BellOff className="w-10 h-10 mx-auto" />
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
