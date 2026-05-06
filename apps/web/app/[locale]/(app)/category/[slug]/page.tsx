import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/post-card';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { fetchCategories } from '@/lib/server/categories';
import { fetchPosts } from '@/lib/server/posts';
import { routes } from '@/lib/routes';

const KNOWN_CATEGORY_SLUGS = ['skincare', 'makeup', 'hair', 'wellness', 'fashion', 'lifestyle'];
const PAGE_SIZE = 12;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('category');
  const tCat = await getTranslations('categories');

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const { items, total } = await fetchPosts({
    page,
    pageSize: PAGE_SIZE,
    sort: 'recent',
    categorySlug: slug,
  });

  const label = KNOWN_CATEGORY_SLUGS.includes(slug) ? tCat(slug) : category.name;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-background">
      {/* Category hero */}
      <div
        className="relative h-[300px] mb-8 bg-gradient-to-br from-primary/30 via-primary/15 to-surface-muted"
        aria-hidden={!category.description ? 'true' : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-20 pb-8">
            <p className="text-xs uppercase tracking-wider text-foreground-muted mb-2">
              {t('label')}
            </p>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-4xl lg:text-5xl font-medium text-foreground mb-3"
            >
              {label}
            </h1>
            {category.description ? (
              <p className="text-lg text-foreground-muted max-w-2xl">{category.description}</p>
            ) : null}
            <p className="text-sm text-foreground-muted mt-3">
              {t('postsCount', { count: total })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-20 pb-16">
        {items.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-medium"
            >
              {t('empty.title')}
            </h2>
            <p className="text-foreground-muted">{t('empty.subtitle')}</p>
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
                href={`${routes.category(slug)}${page > 2 ? `?page=${page - 1}` : ''}`}
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
                href={`${routes.category(slug)}?page=${page + 1}`}
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
