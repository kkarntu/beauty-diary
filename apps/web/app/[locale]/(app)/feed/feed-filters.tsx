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
      <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 scrollbar-hide flex-1 min-w-0">
        <Link href="/feed" scroll={false}>
          <CategoryChip label={t('allCategories')} active={!activeSlug} />
        </Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/feed?category=${c.slug}`} scroll={false}>
            <CategoryChip label={labelFor(c)} active={activeSlug === c.slug} />
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-1 border border-border rounded-md p-1 shrink-0">
        {(['recent', 'popular'] as const).map((sort) => (
          <Link
            key={sort}
            href={`/feed${activeSlug ? `?category=${activeSlug}&sort=${sort}` : `?sort=${sort}`}`}
            scroll={false}
            className={cn(
              'px-3 h-8 inline-flex items-center text-sm font-medium rounded transition-colors',
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
