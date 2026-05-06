import { BookOpen, Sparkles, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatLongDate } from '@/lib/format';
import { fetchPosts } from '@/lib/server/posts';
import { routes } from '@/lib/routes';

const KNOWN_CATEGORY_SLUGS = ['skincare', 'makeup', 'hair', 'wellness', 'fashion', 'lifestyle'];

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');
  const tCat = await getTranslations('categories');

  const featuredPost = await fetchPosts({ page: 1, pageSize: 1, sort: 'popular' })
    .then((r) => r.items[0])
    .catch(() => undefined);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-5xl lg:text-6xl font-medium text-foreground mb-6 leading-tight"
              >
                {t('hero.title')}
              </h1>
              <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
                  <Link href={routes.register}>
                    <Sparkles className="w-5 h-5" />
                    {t('hero.ctaPrimary')}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href={routes.feed}>{t('hero.ctaSecondary')}</Link>
                </Button>
              </div>
            </div>

            <div className="relative" aria-hidden="true">
              <div className="aspect-square rounded-full bg-primary/10 flex items-center justify-center">
                <div className="aspect-square w-4/5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="aspect-square w-3/5 rounded-full bg-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured post */}
      {featuredPost ? (
        <section className="py-16 bg-surface">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-20">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-3xl font-medium"
              >
                {t('featured.title')}
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <Link
                href={routes.postDetail(featuredPost.slug)}
                className="relative h-[400px] rounded-xl overflow-hidden bg-surface-muted block"
              >
                {featuredPost.coverImageUrl ? (
                  <Image
                    src={featuredPost.coverImageUrl}
                    alt={featuredPost.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : null}
              </Link>

              <div className="space-y-4">
                <Badge variant="default">
                  {KNOWN_CATEGORY_SLUGS.includes(featuredPost.category.slug)
                    ? tCat(featuredPost.category.slug)
                    : featuredPost.category.name}
                </Badge>

                <h3
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-3xl font-medium leading-tight"
                >
                  <Link
                    href={routes.postDetail(featuredPost.slug)}
                    className="hover:text-primary transition-colors"
                  >
                    {featuredPost.title}
                  </Link>
                </h3>

                {featuredPost.excerpt ? (
                  <p className="text-lg text-foreground-muted leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                ) : null}

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-sm font-medium overflow-hidden">
                    {featuredPost.author.avatarUrl ? (
                      <Image
                        src={featuredPost.author.avatarUrl}
                        alt={featuredPost.author.nickname}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      featuredPost.author.nickname.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm text-foreground">
                    {featuredPost.author.nickname}
                  </span>
                  {featuredPost.publishedAt ? (
                    <span className="caption text-foreground-muted">
                      · {formatLongDate(featuredPost.publishedAt, locale)}
                    </span>
                  ) : null}
                </div>

                <Button asChild variant="outline">
                  <Link href={routes.postDetail(featuredPost.slug)}>
                    {t('featured.readMore')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Features */}
      <section className="py-20">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-20">
          <div className="text-center mb-16 space-y-3">
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-4xl font-medium"
            >
              {t('features.title')}
            </h2>
            <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: BookOpen, key: 'write' },
              { Icon: Users, key: 'community' },
              { Icon: Sparkles, key: 'inspire' },
            ].map(({ Icon, key }) => (
              <div
                key={key}
                className="text-center p-8 bg-surface rounded-xl border border-border space-y-3"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-xl font-medium"
                >
                  {t(`features.${key}.title`)}
                </h3>
                <p className="text-foreground-muted leading-relaxed">
                  {t(`features.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-20 text-center space-y-6">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-medium">
            {t('cta.title')}
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="bg-surface text-foreground hover:bg-surface/90"
          >
            <Link href={routes.register}>{t('cta.button')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
