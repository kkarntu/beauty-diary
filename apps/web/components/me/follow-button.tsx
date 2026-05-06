'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/queries/auth';
import { useFollowUser, useUnfollowUser } from '@/lib/queries/follows';
import { useRouter as useIntlRouter } from '@/i18n/navigation';
import { routes } from '@/lib/routes';

interface Props {
  nickname: string;
  initialIsFollowed: boolean;
  /** When true the button is hidden — used for self-profile. */
  hidden?: boolean;
}

export function FollowButton({ nickname, initialIsFollowed, hidden }: Props) {
  const t = useTranslations('authorProfile.follow');
  const { data: viewer } = useCurrentUser();
  const intlRouter = useIntlRouter();
  const router = useRouter();
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [pending, startTransition] = useTransition();

  if (hidden) return null;

  const onClick = async () => {
    if (!viewer) {
      intlRouter.push(routes.login);
      return;
    }
    const wasFollowed = isFollowed;
    setIsFollowed(!wasFollowed);
    try {
      if (wasFollowed) {
        await unfollow.mutateAsync(nickname);
      } else {
        await follow.mutateAsync(nickname);
      }
      // Refresh the SSR-rendered profile so followers count + button label
      // reflect the new state on the next paint.
      startTransition(() => router.refresh());
    } catch {
      setIsFollowed(wasFollowed);
      toast.error(t('error'));
    }
  };

  const busy = follow.isPending || unfollow.isPending || pending;

  return (
    <Button
      type="button"
      variant={isFollowed ? 'outline' : 'default'}
      onClick={onClick}
      disabled={busy}
      className="w-full shrink-0 sm:w-auto"
    >
      {busy ? t('saving') : isFollowed ? t('unfollow') : t('follow')}
    </Button>
  );
}
