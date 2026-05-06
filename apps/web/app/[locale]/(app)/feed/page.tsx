import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FeedSidebar } from '@/components/feed/feed-sidebar';
import { PostCard } from '@/components/post-card';
import type { Locale } from '@/i18n/routing';
import { fetchCategories } from '@/lib/server/categories';
import { fetchPosts } from '@/lib/server/posts';
import { fetchTrendingTags } from '@/lib/server/tags';
import { FeedFilters } from './feed-filters';
import { FeedPagination } from './feed-pagination';

const PAGE_SIZE = 12;

interface SearchParams {
  page?: string;
  category?: string;
  tag?: string;
  sort?: string;
}

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('feed');

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const categorySlug = sp.category && sp.category.length > 0 ? sp.category : undefined;
  const tagSlug = sp.tag && sp.tag.length > 0 ? sp.tag : undefined;
  const sort: 'recent' | 'popular' = sp.sort === 'popular' ? 'popular' : 'recent';

  const [postsResponse, categories, trendingTags] = await Promise.all([
    fetchPosts({ page, pageSize: PAGE_SIZE, sort, categorySlug, tagSlug }),
    fetchCategories(),
    fetchTrendingTags(8),
  ]);

  const buildHref = (nextPage: number): string => {
    const next = new URLSearchParams();
    if (nextPage > 1) next.set('page', String(nextPage));
    if (categorySlug) next.set('category', categorySlug);
    if (tagSlug) next.set('tag', tagSlug);
    if (sort !== 'recent') next.set('sort', sort);
    const qs = next.toString();
    return `/feed${qs ? `?${qs}` : ''}`;
  };

  return (
    <main className="mx-auto max-w-[1280px] px-6 py-8 lg:px-20">
      <FeedFilters categories={categories} activeSlug={categorySlug} activeSort={sort} />

      {tagSlug ? (
        <p className="text-foreground-muted mb-6 text-sm">{t('filteredByTag', { tag: tagSlug })}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-9">
          {postsResponse.items.length === 0 ? (
            <div className="space-y-3 py-20 text-center">
              <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium">
                {t('empty.title')}
              </h2>
              <p className="text-foreground-muted">{t('empty.subtitle')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {postsResponse.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <FeedPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={postsResponse.total}
            buildHref={buildHref}
          />
        </div>

        <aside className="lg:col-span-3">
          <FeedSidebar activeTag={tagSlug} trendingTags={trendingTags} />
        </aside>
      </div>
    </main>
  );
}
