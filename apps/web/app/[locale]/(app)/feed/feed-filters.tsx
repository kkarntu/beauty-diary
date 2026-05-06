'use client';

import type { CategoryDto } from '@beauty-diary/shared';
import { useTranslations } from 'next-intl';
import { CategoryChip } from '@/components/category-chip';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const KNOWN_CATEGORY_SLUGS = ['skincare', 'makeup', 'hair', 'wellness', 'fashion', 'lifestyle'];

interface Props {
  categories: CategoryDto[];
  activeSlug?: string;
  activeSort: 'recent' | 'popular';
}

export function FeedFilters({ categories, activeSlug, activeSort }: Props) {
  const t = useTranslations('feed');
  const tCat = useTranslations('categories');

  const labelFor = (c: CategoryDto) =>
    KNOWN_CATEGORY_SLUGS.includes(c.slug) ? tCat(c.slug) : c.name;

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="scrollbar-hide -mb-2 flex min-w-0 flex-1 gap-3 overflow-x-auto pb-2">
        <Link href="/feed" scroll={false}>
          <CategoryChip label={t('allCategories')} active={!activeSlug} />
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/feed?category=${c.slug}`} scroll={false}>
            <CategoryChip label={labelFor(c)} active={activeSlug === c.slug} />
          </Link>
        ))}
      </div>

      <div className="border-border flex shrink-0 items-center gap-1 rounded-md border p-1">
        {(['recent', 'popular'] as const).map((sort) => (
          <Link
            key={sort}
            href={`/feed${activeSlug ? `?category=${activeSlug}&sort=${sort}` : `?sort=${sort}`}`}
            scroll={false}
            className={cn(
              'inline-flex h-8 items-center rounded px-3 text-sm font-medium transition-colors',
              activeSort === sort
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-muted',
            )}
          >
            {t(`sort.${sort}`)}
          </Link>
        ))}
      </div>
    </div>
  );
}
