import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { CommentThread } from '@/components/post-detail/comment-thread';
import { PostActions } from '@/components/post-detail/post-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatLongDate } from '@/lib/format';
import { fetchCommentsByPostId } from '@/lib/server/comments';
import { isNotFound } from '@/lib/server/fetch';
import { fetchPostBySlug } from '@/lib/server/posts';
import { routes } from '@/lib/routes';

const KNOWN_CATEGORY_SLUGS = ['skincare', 'makeup', 'hair', 'wellness', 'fashion', 'lifestyle'];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await fetchPostBySlug(slug);
    const description = post.excerpt ?? post.contentHtml.replace(/<[^>]*>/g, ' ').slice(0, 160);
    const ogImages = post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined;
    return {
      title: post.title,
      description,
      openGraph: {
        title: post.title,
        description,
        type: 'article',
        publishedTime: post.publishedAt ?? undefined,
        authors: [post.author.nickname],
        images: ogImages,
      },
      twitter: {
        card: post.coverImageUrl ? 'summary_large_image' : 'summary',
        title: post.title,
        description,
        images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      },
    };
  } catch {
    return { title: 'Beauty Diary' };
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('postDetail');
  const tCat = await getTranslations('categories');

  let post;
  try {
    post = await fetchPostBySlug(slug);
  } catch (err) {
    if (isNotFound(err)) notFound();
    throw err;
  }

  const comments = await fetchCommentsByPostId(post.id);

  const categoryLabel = KNOWN_CATEGORY_SLUGS.includes(post.category.slug)
    ? tCat(post.category.slug)
    : post.category.name;
  const initials = post.author.nickname.slice(0, 1).toUpperCase();

  return (
    <div className="bg-background">
      {/* Back button */}
      <div className="mx-auto max-w-[900px] px-6 py-6 lg:px-20">
        <Button asChild variant="ghost" className="gap-2">
          <Link href={routes.feed}>
            <ArrowLeft className="h-4 w-4" />
            {t('backToFeed')}
          </Link>
        </Button>
      </div>

      {/* Hero image */}
      {post.coverImageUrl ? (
        <div className="mx-auto mb-8 max-w-[900px] px-6 lg:px-20">
          <div className="bg-surface-muted relative h-[280px] w-full overflow-hidden rounded-xl sm:h-[400px] lg:h-[500px]">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 1024px) 760px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      {/* Article */}
      <article className="mx-auto max-w-[900px] px-6 pb-16 lg:px-20">
        <div className="mb-4">
          <Link href={routes.category(post.category.slug)}>
            <Badge className="mb-4">{categoryLabel}</Badge>
          </Link>

          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-foreground mb-6 text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl"
          >
            {post.title}
          </h1>

          {/* Author & actions */}
          <div className="border-border flex flex-col items-start justify-between gap-4 border-y py-4 sm:flex-row sm:items-center">
            <Link
              href={routes.author(post.author.nickname)}
              className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="bg-surface-muted text-foreground relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-medium sm:h-12 sm:w-12 sm:text-lg">
                {post.author.avatarUrl ? (
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.nickname}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="text-foreground font-medium">
                  {post.author.displayName ?? post.author.nickname}
                </p>
                <p className="text-foreground-muted text-xs sm:text-sm">
                  {post.publishedAt ? formatLongDate(post.publishedAt, locale) : ''} ·{' '}
                  {t('readingMinutes', { count: post.readingMinutes })}
                </p>
              </div>
            </Link>

            <div className="shrink-0 self-end sm:self-auto">
              <PostActions
                postId={post.id}
                initialIsLiked={post.isLikedByMe}
                initialIsFavorited={post.isFavoritedByMe}
              />
            </div>
          </div>

          {post.excerpt ? (
            <p className="text-foreground-muted mt-4 text-lg leading-relaxed">{post.excerpt}</p>
          ) : null}
        </div>

        {/* Body */}
        <div
          className="post-content text-foreground"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Tags */}
        {post.tags.length > 0 ? (
          <div className="border-border mt-8 flex flex-wrap gap-2 border-t pt-4">
            {post.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/feed?tag=${tag.slug}`}
                className="text-foreground-muted hover:text-primary hover:bg-surface-muted rounded-full px-2.5 py-1 text-sm transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Comments — hidden when the author disabled them on this post */}
        {post.allowComments ? (
          <section className="border-border mt-4 border-t pt-4">
            <CommentThread postId={post.id} initialComments={comments} />
          </section>
        ) : (
          <section className="border-border mt-4 border-t pt-4">
            <p className="text-foreground-muted py-8 text-center text-sm">
              {t('comments.disabledByAuthor')}
            </p>
          </section>
        )}
      </article>
    </div>
  );
}
