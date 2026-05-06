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
      className="flex items-center justify-center gap-3 pt-8 mt-8 border-t border-border"
    >
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          'inline-flex items-center gap-1 h-9 px-3 rounded-md text-sm font-medium border border-border bg-surface',
          page <= 1
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-surface-muted text-foreground',
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
          'inline-flex items-center gap-1 h-9 px-3 rounded-md text-sm font-medium border border-border bg-surface',
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
