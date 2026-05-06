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

export default async function LandingPage({ params }: { params: Promise<{ locale: Locale }> }) {
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
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1
                style={{ fontFamily: 'var(--font-display)' }}
                className="text-foreground mb-6 text-5xl font-medium leading-tight lg:text-6xl"
              >
                {t('hero.title')}
              </h1>
              <p className="text-foreground-muted mb-8 text-xl leading-relaxed">
                {t('hero.subtitle')}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
                  <Link href={routes.register}>
                    <Sparkles className="h-5 w-5" />
                    {t('hero.ctaPrimary')}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href={routes.feed}>{t('hero.ctaSecondary')}</Link>
                </Button>
              </div>
            </div>

            <div className="relative" aria-hidden="true">
              <div className="bg-primary/10 flex aspect-square items-center justify-center rounded-full">
                <div className="bg-primary/20 flex aspect-square w-4/5 items-center justify-center rounded-full">
                  <div className="bg-primary/30 aspect-square w-3/5 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured post */}
      {featuredPost ? (
        <section className="bg-surface py-16">
          <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
            <div className="mb-8 flex items-center gap-2">
              <TrendingUp className="text-primary h-6 w-6" />
              <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-medium">
                {t('featured.title')}
              </h2>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-2">
              <Link
                href={routes.postDetail(featuredPost.slug)}
                className="bg-surface-muted relative block h-[400px] overflow-hidden rounded-xl"
              >
                {featuredPost.coverImageUrl ? (
                  <Image
                    src={featuredPost.coverImageUrl}
                    alt={featuredPost.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 hover:scale-105"
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
                  <p className="text-foreground-muted text-lg leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                ) : null}

                <div className="flex items-center gap-3 pt-2">
                  <div className="bg-surface-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-medium">
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
                  <span className="text-foreground text-sm">{featuredPost.author.nickname}</span>
                  {featuredPost.publishedAt ? (
                    <span className="caption text-foreground-muted">
                      · {formatLongDate(featuredPost.publishedAt, locale)}
                    </span>
                  ) : null}
                </div>

                <Button asChild variant="outline">
                  <Link href={routes.postDetail(featuredPost.slug)}>{t('featured.readMore')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-20">
          <div className="mb-16 space-y-3 text-center">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-medium">
              {t('features.title')}
            </h2>
            <p className="text-foreground-muted mx-auto max-w-2xl text-lg">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icon: BookOpen, key: 'write' },
              { Icon: Users, key: 'community' },
              { Icon: Sparkles, key: 'inspire' },
            ].map(({ Icon, key }) => (
              <div
                key={key}
                className="bg-surface border-border space-y-3 rounded-xl border p-8 text-center"
              >
                <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                  <Icon className="text-primary h-8 w-8" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-medium">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="text-foreground-muted leading-relaxed">{t(`features.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="mx-auto max-w-[1280px] space-y-6 px-6 text-center lg:px-20">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-medium">
            {t('cta.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg opacity-90">{t('cta.subtitle')}</p>
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
