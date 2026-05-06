'use client';

import type { NotificationDto } from '@beauty-diary/shared';
import { formatDistanceToNow } from 'date-fns';
import { enUS, uk } from 'date-fns/locale';
import { Heart, MessageSquare, UserPlus, type LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface Props {
  notification: NotificationDto;
  onClick?: () => void;
  variant?: 'dropdown' | 'page';
}

/**
 * Single rendering of a notification, shared by the header dropdown and
 * the standalone /me/notifications page. Resolves the right icon, link,
 * and copy from the notification's `type` + `payload` shape.
 */
export function NotificationRow({ notification: n, onClick, variant = 'dropdown' }: Props) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const dateLocale = locale === 'uk' ? uk : enUS;

  const { Icon, href, message } = render(n, t);
  const when = formatDistanceToNow(new Date(n.createdAt), {
    addSuffix: true,
    locale: dateLocale,
  });

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'hover:bg-surface-muted flex w-full cursor-pointer items-start gap-3 transition-colors',
        variant === 'dropdown' ? 'px-3 py-3' : 'rounded-lg px-4 py-4',
        !n.readAt && (variant === 'dropdown' ? 'bg-primary/5' : 'bg-primary/5'),
      )}
    >
      <div className="bg-surface-muted text-foreground-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground line-clamp-2 text-sm">{message}</p>
        <p className="caption text-foreground-muted mt-0.5">{when}</p>
      </div>
      {!n.readAt ? (
        <span aria-hidden className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />
      ) : null}
    </Link>
  );
}

interface Rendered {
  Icon: LucideIcon;
  href: string;
  message: string;
}

function render(
  n: NotificationDto,
  t: ReturnType<typeof useTranslations<'notifications'>>,
): Rendered {
  const payload = n.payload as Record<string, unknown>;
  const actor = (payload.actor as { nickname?: string; displayName?: string | null }) ?? {};
  const actorName = actor.displayName ?? actor.nickname ?? '';
  const post = payload.post as { slug?: string; title?: string } | undefined;

  switch (n.type) {
    case 'comment.created':
      return {
        Icon: MessageSquare,
        href: post?.slug ? `/posts/${post.slug}` : '#',
        message: t('commentBody', { name: actorName, title: post?.title ?? '' }),
      };
    case 'post.liked':
      return {
        Icon: Heart,
        href: post?.slug ? `/posts/${post.slug}` : '#',
        message: t('likeBody', { name: actorName, title: post?.title ?? '' }),
      };
    case 'user.followed':
      return {
        Icon: UserPlus,
        href: actor.nickname ? `/users/${actor.nickname}` : '#',
        message: t('followBody', { name: actorName }),
      };
    default:
      return {
        Icon: MessageSquare,
        href: '#',
        message: '',
      };
  }
}
