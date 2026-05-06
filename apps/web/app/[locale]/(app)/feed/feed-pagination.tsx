import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}

export async function FeedPagination({ page, pageSize, total, buildHref }: Props) {
  const t = await getTranslations('feed.pagination');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={t('label')}
      className="border-border mt-8 flex items-center justify-center gap-3 border-t pt-8"
    >
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          'border-border bg-surface inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium',
          page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-surface-muted text-foreground',
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('previous')}
      </Link>

      <span className="caption text-foreground-muted tabular-nums">
        {t('pageOf', { page, total: totalPages })}
      </span>

      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={cn(
          'border-border bg-surface inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium',
          page >= totalPages
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-surface-muted text-foreground',
        )}
      >
        {t('next')}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
