'use client';

import { Bookmark, Heart, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { useCurrentUser } from '@/lib/queries/auth';
import {
  useFavoritePost,
  useLikePost,
  useUnfavoritePost,
  useUnlikePost,
} from '@/lib/queries/reactions';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface Props {
  postId: string;
  initialIsLiked: boolean;
  initialIsFavorited: boolean;
}

export function PostActions({ postId, initialIsLiked, initialIsFavorited }: Props) {
  const t = useTranslations('postDetail.actions');
  const tAuth = useTranslations('postDetail.requiresAuth');
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const [liked, setLiked] = useState(initialIsLiked);
  const [favorited, setFavorited] = useState(initialIsFavorited);

  const like = useLikePost();
  const unlike = useUnlikePost();
  const favorite = useFavoritePost();
  const unfavorite = useUnfavoritePost();

  const requireLogin = (): boolean => {
    if (user) return false;
    toast(tAuth('title'), {
      description: tAuth('description'),
      action: { label: tAuth('cta'), onClick: () => router.push(routes.login) },
    });
    return true;
  };

  const onToggleLike = async () => {
    if (requireLogin()) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    try {
      if (wasLiked) await unlike.mutateAsync(postId);
      else await like.mutateAsync(postId);
      toast.success(wasLiked ? t('unliked') : t('liked'));
    } catch {
      setLiked(wasLiked);
      toast.error(t('errorLike'));
    }
  };

  const onToggleFavorite = async () => {
    if (requireLogin()) return;
    const wasFav = favorited;
    setFavorited(!wasFav);
    try {
      if (wasFav) await unfavorite.mutateAsync(postId);
      else await favorite.mutateAsync(postId);
      toast.success(wasFav ? t('favoriteRemoved') : t('favoriteAdded'));
    } catch {
      setFavorited(wasFav);
      toast.error(t('errorFavorite'));
    }
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('shareCopied'));
    } catch {
      toast.error(t('shareFailed'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleLike}
        aria-pressed={liked}
        aria-label={liked ? t('unlikeAria') : t('likeAria')}
        className={cn(liked && 'text-destructive hover:text-destructive')}
      >
        <Heart className={cn('h-5 w-5 transition-all', liked && 'scale-110 fill-current')} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleFavorite}
        aria-pressed={favorited}
        aria-label={favorited ? t('unfavoriteAria') : t('favoriteAria')}
        className={cn(favorited && 'text-primary hover:text-primary')}
      >
        <Bookmark className={cn('h-5 w-5 transition-all', favorited && 'scale-110 fill-current')} />
      </Button>
      <Button variant="ghost" size="icon" onClick={onShare} aria-label={t('shareAria')}>
        <Share2 className="h-5 w-5" />
      </Button>
    </div>
  );
}
