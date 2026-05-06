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
        'flex items-start gap-3 cursor-pointer w-full transition-colors hover:bg-surface-muted',
        variant === 'dropdown' ? 'px-3 py-3' : 'px-4 py-4 rounded-lg',
        !n.readAt && (variant === 'dropdown' ? 'bg-primary/5' : 'bg-primary/5'),
      )}
    >
      <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-foreground-muted shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2">{message}</p>
        <p className="caption text-foreground-muted mt-0.5">{when}</p>
      </div>
      {!n.readAt ? (
        <span aria-hidden className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
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
