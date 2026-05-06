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
    const description =
      post.excerpt ?? post.contentHtml.replace(/<[^>]*>/g, ' ').slice(0, 160);
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
      <div className="max-w-[900px] mx-auto px-6 lg:px-20 py-6">
        <Button asChild variant="ghost" className="gap-2">
          <Link href={routes.feed}>
            <ArrowLeft className="w-4 h-4" />
            {t('backToFeed')}
          </Link>
        </Button>
      </div>

      {/* Hero image */}
      {post.coverImageUrl ? (
        <div className="max-w-[900px] mx-auto px-6 lg:px-20 mb-8">
          <div className="relative w-full h-[280px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden bg-surface-muted">
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
      <article className="max-w-[900px] mx-auto px-6 lg:px-20 pb-16">
        <div className="mb-4">
          <Link href={routes.category(post.category.slug)}>
            <Badge className="mb-4">{categoryLabel}</Badge>
          </Link>

          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-3xl sm:text-4xl lg:text-5xl font-medium text-foreground mb-6 leading-tight"
          >
            {post.title}
          </h1>

          {/* Author & actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-y border-border">
            <Link
              href={routes.author(post.author.nickname)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-muted flex items-center justify-center text-foreground text-base sm:text-lg font-medium flex-shrink-0 overflow-hidden relative">
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
                <p className="font-medium text-foreground">
                  {post.author.displayName ?? post.author.nickname}
                </p>
                <p className="text-xs sm:text-sm text-foreground-muted">
                  {post.publishedAt ? formatLongDate(post.publishedAt, locale) : ''} ·{' '}
                  {t('readingMinutes', { count: post.readingMinutes })}
                </p>
              </div>
            </Link>

            <div className="shrink-0 self-end sm:self-auto">
              <PostActions
                postId={post.id}
                initialLikesCount={post.likesCount}
                initialIsLiked={post.isLikedByMe}
                initialIsFavorited={post.isFavoritedByMe}
              />
            </div>
          </div>

          {post.excerpt ? (
            <p className="text-lg text-foreground-muted leading-relaxed mt-4">{post.excerpt}</p>
          ) : null}
        </div>

        {/* Body */}
        <div
          className="post-content text-foreground"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Tags */}
        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-border">
            {post.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/feed?tag=${tag.slug}`}
                className="px-2.5 py-1 text-sm text-foreground-muted hover:text-primary hover:bg-surface-muted rounded-full transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Comments — hidden when the author disabled them on this post */}
        {post.allowComments ? (
          <section className="mt-4 pt-4 border-t border-border">
            <CommentThread postId={post.id} initialComments={comments} />
          </section>
        ) : (
          <section className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-foreground-muted text-center py-8">
              {t('comments.disabledByAuthor')}
            </p>
          </section>
        )}
      </article>
    </div>
  );
}
