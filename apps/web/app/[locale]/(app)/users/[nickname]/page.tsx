import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { FollowButton } from '@/components/me/follow-button';
import { PostCard } from '@/components/post-card';
import type { Locale } from '@/i18n/routing';
import { isNotFound } from '@/lib/server/fetch';
import { fetchCurrentUser } from '@/lib/server/me';
import { fetchPosts } from '@/lib/server/posts';
import { fetchUserByNickname } from '@/lib/server/users';

const PAGE_SIZE = 12;

export default async function AuthorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; nickname: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, nickname } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('authorProfile');

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  let user;
  try {
    user = await fetchUserByNickname(nickname);
  } catch (err) {
    if (isNotFound(err)) notFound();
    throw err;
  }

  const me = await fetchCurrentUser();
  const isSelf = me?.id === user.id;

  const { items, total } = await fetchPosts({
    page,
    pageSize: PAGE_SIZE,
    sort: 'recent',
    authorNickname: nickname,
  });

  const initials = user.nickname.slice(0, 1).toUpperCase();

  return (
    <div className="bg-background">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-20 py-12">
        {/* Author header card */}
        <div className="bg-surface rounded-xl border border-border p-4 sm:p-6 lg:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-surface-muted flex items-center justify-center text-3xl sm:text-4xl font-medium text-foreground shrink-0 mx-auto sm:mx-0 overflow-hidden relative">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.nickname}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <span style={{ fontFamily: 'var(--font-display)' }}>{initials}</span>
              )}
            </div>

            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <h1
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-2xl sm:text-3xl font-medium text-foreground"
                  >
                    {user.displayName ?? user.nickname}
                  </h1>
                  <p className="text-sm text-foreground-muted">@{user.nickname}</p>
                </div>
                <FollowButton
                  nickname={user.nickname}
                  initialIsFollowed={user.isFollowedByMe}
                  hidden={isSelf}
                />
              </div>

              {user.bio ? (
                <p className="text-foreground leading-relaxed mt-4 mb-6">{user.bio}</p>
              ) : null}

              <div className="flex gap-8">
                <div>
                  <p
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-2xl font-medium text-foreground tabular-nums"
                  >
                    {total}
                  </p>
                  <p className="text-sm text-foreground-muted">{t('postsLabel')}</p>
                </div>
                <div>
                  <p
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-2xl font-medium text-foreground tabular-nums"
                  >
                    {user.followersCount}
                  </p>
                  <p className="text-sm text-foreground-muted">{t('followersLabel')}</p>
                </div>
                <div>
                  <p
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-2xl font-medium text-foreground tabular-nums"
                  >
                    {user.followingCount}
                  </p>
                  <p className="text-sm text-foreground-muted">{t('followingLabel')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {items.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <h2
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-2xl font-medium"
            >
              {t('empty.title')}
            </h2>
            <p className="text-foreground-muted">{t('empty.subtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
