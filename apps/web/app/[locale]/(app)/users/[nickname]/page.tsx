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
      <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-20">
        {/* Author header card */}
        <div className="bg-surface border-border mb-8 rounded-xl border p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
            <div className="bg-surface-muted text-foreground relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full text-3xl font-medium sm:mx-0 sm:h-32 sm:w-32 sm:text-4xl">
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

            <div className="w-full min-w-0 flex-1">
              <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-foreground text-2xl font-medium sm:text-3xl"
                  >
                    {user.displayName ?? user.nickname}
                  </h1>
                  <p className="text-foreground-muted text-sm">@{user.nickname}</p>
                </div>
                <FollowButton
                  nickname={user.nickname}
                  initialIsFollowed={user.isFollowedByMe}
                  hidden={isSelf}
                />
              </div>

              {user.bio ? (
                <p className="text-foreground mb-6 mt-4 leading-relaxed">{user.bio}</p>
              ) : null}

              <div className="flex gap-8">
                <div>
                  <p
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-foreground text-2xl font-medium tabular-nums"
                  >
                    {total}
                  </p>
                  <p className="text-foreground-muted text-sm">{t('postsLabel')}</p>
                </div>
                <div>
                  <p
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-foreground text-2xl font-medium tabular-nums"
                  >
                    {user.followersCount}
                  </p>
                  <p className="text-foreground-muted text-sm">{t('followersLabel')}</p>
                </div>
                <div>
                  <p
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-foreground text-2xl font-medium tabular-nums"
                  >
                    {user.followingCount}
                  </p>
                  <p className="text-foreground-muted text-sm">{t('followingLabel')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {items.length === 0 ? (
          <div className="space-y-3 py-20 text-center">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-medium">
              {t('empty.title')}
            </h2>
            <p className="text-foreground-muted">{t('empty.subtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
