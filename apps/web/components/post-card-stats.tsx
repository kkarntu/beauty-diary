'use client';

import { Heart, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/realtime/socket-context';
import { cn } from '@/lib/utils';

interface Props {
  postId: string;
  initialLikesCount: number;
  initialCommentsCount: number;
  isLikedByMe: boolean;
}

interface StatsPayload {
  postId: string;
  likesCount: number;
  commentsCount: number;
}

/**
 * Like + comment count badges for a feed/grid card. Subscribes to the
 * `post:{id}` socket room and updates the counts in place when the
 * server pushes a `post:stats` event. The room subscription is scoped
 * to the lifetime of the rendered card.
 */
export function PostCardStats({
  postId,
  initialLikesCount,
  initialCommentsCount,
  isLikedByMe,
}: Props) {
  const socket = useSocket();
  const [stats, setStats] = useState({
    likesCount: initialLikesCount,
    commentsCount: initialCommentsCount,
  });

  useEffect(() => {
    if (!socket) return;

    const join = () => socket.emit('subscribe:post', postId);
    if (socket.connected) join();
    socket.on('connect', join);

    const onStats = (payload: StatsPayload) => {
      if (payload.postId !== postId) return;
      setStats({
        likesCount: payload.likesCount,
        commentsCount: payload.commentsCount,
      });
    };
    socket.on('post:stats', onStats);

    return () => {
      socket.emit('unsubscribe:post', postId);
      socket.off('connect', join);
      socket.off('post:stats', onStats);
    };
  }, [socket, postId]);

  return (
    <div className="text-foreground-muted flex flex-shrink-0 items-center gap-3">
      <div className="flex items-center gap-1 tabular-nums">
        <Heart
          className={cn('h-4 w-4 flex-shrink-0', isLikedByMe && 'fill-primary text-primary')}
        />
        <span className="text-sm">{stats.likesCount}</span>
      </div>
      <div className="flex items-center gap-1 tabular-nums">
        <MessageCircle className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">{stats.commentsCount}</span>
      </div>
    </div>
  );
}
