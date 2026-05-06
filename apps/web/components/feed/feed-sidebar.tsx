import type { TrendingTagDto } from '@beauty-diary/shared';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { NewsletterSignup } from './newsletter-signup';

interface Props {
  activeTag?: string;
  trendingTags: TrendingTagDto[];
}

export function FeedSidebar({ activeTag, trendingTags }: Props) {
  const t = useTranslations('feed.sidebar');

  return (
    <aside className="lg:sticky lg:top-24 space-y-6 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      {trendingTags.length > 0 ? (
        <div className="bg-surface rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
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
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
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

      <NewsletterSignup />
    </aside>
  );
}
