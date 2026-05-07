import type { TrendingTagDto } from '@beauty-diary/shared';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface Props {
  activeTag?: string;
  trendingTags: TrendingTagDto[];
}

export function FeedSidebar({ activeTag, trendingTags }: Props) {
  const t = useTranslations('feed.sidebar');

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      {trendingTags.length > 0 ? (
        <div className="bg-surface border-border rounded-lg border p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary h-5 w-5" />
            <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-medium">
              {t('trendingTitle')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map(({ slug, name }) => {
              const isActive = activeTag === slug;
              return (
                <Link
                  key={slug}
                  href={isActive ? '/feed' : `/feed?tag=${slug}`}
                  scroll={false}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-muted hover:text-primary hover:bg-surface-muted',
                  )}
                >
                  #{name}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
