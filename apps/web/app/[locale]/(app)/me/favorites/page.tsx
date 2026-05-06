import { Bookmark } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { fetchCurrentUser, fetchMyFavorites } from '@/lib/server/me';
import { routes } from '@/lib/routes';

const PAGE_SIZE = 12;

export default async function FavoritesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('favorites');

  const me = await fetchCurrentUser();
  if (!me) redirect('/login');

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const { items, total } = await fetchMyFavorites(page, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-20 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl sm:text-3xl font-medium text-foreground"
            >
              {t('title')}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-foreground-muted">{t('subtitle')}</p>
        </header>

        {items.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Bookmark className="w-12 h-12 mx-auto text-foreground-muted" />
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-medium"
            >
              {t('empty.title')}
            </h2>
            <p className="text-foreground-muted">{t('empty.subtitle')}</p>
            <Button asChild>
              <Link href={routes.feed}>{t('empty.cta')}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="flex items-center justify-center gap-3 pt-8 mt-8 border-t border-border">
            {page > 1 ? (
              <Link
                href={`${routes.myFavorites}${page > 2 ? `?page=${page - 1}` : ''}`}
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
                href={`${routes.myFavorites}?page=${page + 1}`}
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
