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
        className="group overflow-hidden border-border hover:shadow-md transition-all duration-300 cursor-pointer h-full flex flex-col hover:scale-[1.02] gap-0 p-0"
      >
        <div className={cn('relative overflow-hidden flex-shrink-0 bg-surface-muted', featured ? 'h-96' : 'h-56')}>
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              sizes={featured ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw'}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
        </div>

        <div className="p-6 flex flex-col flex-1 min-w-0">
          <Link href={routes.category(post.category.slug)}>
            <Badge
              variant="secondary"
              className="mb-3 bg-surface-muted text-foreground border-0 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer inline-flex w-fit"
            >
              {categoryLabel}
            </Badge>
          </Link>

          <h3
            style={{ fontFamily: 'var(--font-display)' }}
            className={cn(
              'mb-3 font-medium text-foreground line-clamp-2 break-words',
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

          <div className="flex items-center justify-between pt-4 border-t border-border mt-auto min-w-0 gap-4">
            <Link
              href={routes.author(post.author.nickname)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0 flex-shrink"
            >
              <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-foreground-muted text-sm font-medium flex-shrink-0 overflow-hidden relative">
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
                <p className="text-sm font-medium text-foreground truncate">{post.author.nickname}</p>
                {dateLabel ? (
                  <p className="text-xs text-foreground-muted caption truncate">{dateLabel}</p>
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
