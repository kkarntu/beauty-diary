'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { PostListItemDto } from '@beauty-diary/shared';
import { PostCardStats } from '@/components/post-card-stats';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Link, useRouter } from '@/i18n/navigation';
import { formatLongDate } from '@/lib/format';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface Props {
  post: PostListItemDto;
  featured?: boolean;
}

const KNOWN_CATEGORY_SLUGS = ['skincare', 'makeup', 'hair', 'wellness', 'fashion', 'lifestyle'];

export function PostCard({ post, featured = false }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const tCat = useTranslations('categories');
  const categoryLabel = KNOWN_CATEGORY_SLUGS.includes(post.category.slug)
    ? tCat(post.category.slug)
    : post.category.name;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) return;
    router.push(routes.postDetail(post.slug));
  };

  const dateLabel = post.publishedAt ? formatLongDate(post.publishedAt, locale) : '';
  const initials = post.author.nickname.slice(0, 1).toUpperCase();

  return (
    <div className={cn(featured && 'col-span-full md:col-span-2')}>
      <Card
        onClick={handleCardClick}
        className="border-border group flex h-full cursor-pointer flex-col gap-0 overflow-hidden p-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
      >
        <div
          className={cn(
            'bg-surface-muted relative flex-shrink-0 overflow-hidden',
            featured ? 'h-96' : 'h-56',
          )}
        >
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              sizes={
                featured
                  ? '(min-width: 768px) 66vw, 100vw'
                  : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'
              }
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-6">
          <Link href={routes.category(post.category.slug)}>
            <Badge
              variant="secondary"
              className="bg-surface-muted text-foreground hover:bg-primary hover:text-primary-foreground mb-3 inline-flex w-fit cursor-pointer border-0 transition-colors"
            >
              {categoryLabel}
            </Badge>
          </Link>

          <h3
            style={{ fontFamily: 'var(--font-display)' }}
            className={cn(
              'text-foreground mb-3 line-clamp-2 break-words font-medium',
              featured ? 'text-2xl' : 'text-xl',
            )}
          >
            {post.title}
          </h3>

          {post.excerpt ? (
            <p
              className={cn(
                'text-foreground-muted mb-4 line-clamp-2 break-words',
                featured ? 'text-base' : 'text-sm',
              )}
            >
              {post.excerpt}
            </p>
          ) : null}

          <div className="border-border mt-auto flex min-w-0 items-center justify-between gap-4 border-t pt-4">
            <Link
              href={routes.author(post.author.nickname)}
              className="flex min-w-0 flex-shrink items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="bg-surface-muted text-foreground-muted relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium">
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.nickname}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-shrink overflow-hidden">
                <p className="text-foreground truncate text-sm font-medium">
                  {post.author.nickname}
                </p>
                {dateLabel ? (
                  <p className="text-foreground-muted caption truncate text-xs">{dateLabel}</p>
                ) : null}
              </div>
            </Link>

            <PostCardStats
              postId={post.id}
              initialLikesCount={post.likesCount}
              initialCommentsCount={post.commentsCount}
              isLikedByMe={post.isLikedByMe}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
