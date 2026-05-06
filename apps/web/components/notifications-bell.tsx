'use client';

import type { NotificationDto } from '@beauty-diary/shared';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/i18n/navigation';
import { useCurrentUser } from '@/lib/queries/auth';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationStream,
  useNotifications,
  useUnreadNotificationCount,
} from '@/lib/queries/notifications';
import { routes } from '@/lib/routes';
import { useMounted } from '@/lib/use-mounted';
import { NotificationRow } from './notification-row';

export function NotificationsBell() {
  const t = useTranslations('notifications');
  const mounted = useMounted();
  const { data: user } = useCurrentUser();
  const enabled = mounted && Boolean(user);
  useNotificationStream();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: list, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (!enabled) return null;

  const items = list?.items ?? [];

  const onItemClick = (n: NotificationDto) => {
    if (!n.readAt) markRead.mutate(n.id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground-muted hover:text-foreground relative"
          aria-label={t('aria')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span
              aria-live="polite"
              className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] rounded-full px-1 text-center text-[10px] font-medium tabular-nums leading-[18px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('title')}</span>
          {items.some((n) => !n.readAt) ? (
            <button
              type="button"
              className="text-foreground-muted hover:text-primary text-xs"
              onClick={(e) => {
                e.preventDefault();
                markAll.mutate();
              }}
            >
              {t('markAllRead')}
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="text-foreground-muted flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-foreground-muted px-4 py-6 text-center text-sm">{t('error')}</div>
        ) : items.length === 0 ? (
          <div className="text-foreground-muted space-y-2 px-4 py-6 text-center">
            <BellOff className="mx-auto h-6 w-6" />
            <p className="text-sm">{t('empty')}</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <DropdownMenuItem key={n.id} asChild className="p-0 focus:bg-transparent">
                <NotificationRow
                  notification={n}
                  onClick={() => onItemClick(n)}
                  variant="dropdown"
                />
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {items.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <Link
              href={routes.notifications}
              className="text-primary hover:bg-surface-muted block px-3 py-2 text-center text-sm"
            >
              {t('viewAll')}
            </Link>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
