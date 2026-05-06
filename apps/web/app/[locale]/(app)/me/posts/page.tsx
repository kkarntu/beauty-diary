import type { PostStatus } from '@beauty-diary/shared';
import { Eye, Heart, MessageCircle, PenSquare } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatLongDate } from '@/lib/format';
import { fetchCurrentUser } from '@/lib/server/me';
import { fetchPosts } from '@/lib/server/posts';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;
type Filter = 'all' | PostStatus;
const VALID_FILTERS: Filter[] = ['all', 'draft', 'published', 'archived'];

export default async function MyPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('myPosts');

  const me = await fetchCurrentUser();
  if (!me) redirect('/login');

  const sp = await searchParams;
  const filterParam = sp.status as Filter | undefined;
  const filter: Filter = filterParam && VALID_FILTERS.includes(filterParam) ? filterParam : 'all';
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const { items, total } = await fetchPosts({
    page,
    pageSize: PAGE_SIZE,
    sort: 'recent',
    mine: true,
    status: filter === 'all' ? undefined : (filter as PostStatus),
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filterHref = (f: Filter) => (f === 'all' ? routes.myPosts : `${routes.myPosts}?status=${f}`);

  return (
    <div className="bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-20 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl sm:text-3xl font-medium text-foreground mb-2"
            >
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-foreground-muted">{t('subtitle')}</p>
          </div>
          <Button asChild className="gap-2 shrink-0 w-full sm:w-auto">
            <Link href={routes.newPost}>
              <PenSquare className="w-4 h-4" />
              {t('newPost')}
            </Link>
          </Button>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
          {VALID_FILTERS.map((f) => (
            <Link
              key={f}
              href={filterHref(f)}
              className={cn(
                'px-4 h-9 inline-flex items-center text-sm font-medium rounded-md whitespace-nowrap transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted',
              )}
            >
              {t(`filters.${f}`)}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-medium"
            >
              {t('empty.title')}
            </h2>
            <p className="text-foreground-muted">{t('empty.subtitle')}</p>
            <Button asChild>
              <Link href={routes.newPost}>{t('empty.cta')}</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((post) => {
              const status: PostStatus = post.status ?? 'published';
              const dateLabel = post.publishedAt
                ? formatLongDate(post.publishedAt, locale)
                : '';
              return (
                <li
                  key={post.id}
                  className="bg-surface rounded-lg border border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-0',
                          status === 'published' && 'bg-primary/10 text-primary',
                          status === 'draft' && 'bg-surface-muted text-foreground-muted',
                          status === 'archived' && 'bg-foreground-muted/10 text-foreground-muted',
                        )}
                      >
                        {t(`status.${status}`)}
                      </Badge>
                      <span className="text-xs text-foreground-muted">
                        {post.category.name}
                      </span>
                      {dateLabel ? (
                        <span className="text-xs text-foreground-muted">· {dateLabel}</span>
                      ) : null}
                    </div>
                    <h3
                      style={{ fontFamily: 'var(--font-display)' }}
                      className="text-lg font-medium text-foreground mb-2 truncate"
                    >
                      {post.title}
                    </h3>
                    {status === 'published' ? (
                      <div className="flex items-center gap-4 text-xs text-foreground-muted">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          <span className="tabular-nums">{post.likesCount}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          <span className="tabular-nums">{post.commentsCount}</span>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {status === 'published' ? (
                      <Button asChild variant="ghost" size="sm" className="gap-1">
                        <Link href={routes.postDetail(post.slug)}>
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('actions.view')}</span>
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link href={routes.postEdit(post.slug)}>
                        <PenSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('actions.edit')}</span>
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav className="flex items-center justify-center gap-3 pt-8 mt-8 border-t border-border">
            {page > 1 ? (
              <Link
                href={`${filterHref(filter)}${
                  filter === 'all'
                    ? page > 2
                      ? `?page=${page - 1}`
                      : ''
                    : `&page=${page - 1}`
                }`}
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                ← {t('previous')}
              </Link>
            ) : null}
            <span className="text-sm text-foreground-muted tabular-nums">
              {t('pageOf', { page, total: totalPages })}
            </span>
            {page < totalPages ? (
              <Link
                href={`${filterHref(filter)}${filter === 'all' ? '?' : '&'}page=${page + 1}`}
                className="text-sm font-medium text-foreground hover:text-primary"
              >
                {t('next')} →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
