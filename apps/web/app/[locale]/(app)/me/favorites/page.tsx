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
      <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-20">
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-2 sm:gap-3">
            <Bookmark className="text-primary h-6 w-6 flex-shrink-0 sm:h-8 sm:w-8" />
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-foreground text-2xl font-medium sm:text-3xl"
            >
              {t('title')}
            </h1>
          </div>
          <p className="text-foreground-muted text-sm sm:text-base">{t('subtitle')}</p>
        </header>

        {items.length === 0 ? (
          <div className="space-y-4 py-20 text-center">
            <Bookmark className="text-foreground-muted mx-auto h-12 w-12" />
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium">
              {t('empty.title')}
            </h2>
            <p className="text-foreground-muted">{t('empty.subtitle')}</p>
            <Button asChild>
              <Link href={routes.feed}>{t('empty.cta')}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="border-border mt-8 flex items-center justify-center gap-3 border-t pt-8">
            {page > 1 ? (
              <Link
                href={`${routes.myFavorites}${page > 2 ? `?page=${page - 1}` : ''}`}
                className="text-foreground hover:text-primary text-sm font-medium"
              >
                ← {t('previous')}
              </Link>
            ) : null}
            <span className="text-foreground-muted text-sm tabular-nums">
              {t('pageOf', { page, total: totalPages })}
            </span>
            {page < totalPages ? (
              <Link
                href={`${routes.myFavorites}?page=${page + 1}`}
                className="text-foreground hover:text-primary text-sm font-medium"
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
