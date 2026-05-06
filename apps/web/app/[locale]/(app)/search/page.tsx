import { Search as SearchIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PostCard } from '@/components/post-card';
import { SearchBox } from '@/components/search/search-box';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { fetchPosts } from '@/lib/server/posts';
import { routes } from '@/lib/routes';

const PAGE_SIZE = 12;

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('search');

  const sp = await searchParams;
  const q = sp.q && sp.q.trim().length > 0 ? sp.q.trim() : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const data = q
    ? await fetchPosts({ q, page, pageSize: PAGE_SIZE, sort: 'recent' })
    : null;

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const buildHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (nextPage > 1) next.set('page', String(nextPage));
    const qs = next.toString();
    return `${routes.search}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-20 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <SearchIcon className="w-6 h-6 text-primary" />
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl sm:text-3xl font-medium text-foreground"
            >
              {t('title')}
            </h1>
          </div>
          <SearchBox initialQuery={q ?? ''} placeholder={t('placeholder')} />
        </header>

        {!q ? (
          <div className="text-center py-20 space-y-3">
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-medium"
            >
              {t('intro.title')}
            </h2>
            <p className="text-foreground-muted">{t('intro.subtitle')}</p>
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-medium"
            >
              {t('empty.title')}
            </h2>
            <p className="text-foreground-muted">{t('empty.subtitle')}</p>
          </div>
        ) : data ? (
          <>
            <p className="text-sm text-foreground-muted mb-6">
              {t('resultsFor', { query: q })} · {t('resultsCount', { count: data.total })}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {totalPages > 1 ? (
              <nav className="flex items-center justify-center gap-3 pt-8 mt-8 border-t border-border">
                {page > 1 ? (
                  <Link
                    href={buildHref(page - 1)}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    ← {page - 1}
                  </Link>
                ) : null}
                <span className="text-sm text-foreground-muted tabular-nums">
                  {page} / {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={buildHref(page + 1)}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    {page + 1} →
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
