'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { commentKeys } from '@/lib/queries/comments';
import { useSocket } from '@/lib/realtime/socket-context';

const COMMENT_EVENTS = ['comment:created', 'comment:updated', 'comment:deleted'] as const;

/**
 * Subscribes to the post's WebSocket room and invalidates the cached
 * comments list whenever the server pushes a comment lifecycle event
 * (`comment:created` / `comment:updated` / `comment:deleted`). The
 * thread re-fetches and re-renders without a page refresh.
 */
export function useCommentStream(postId: string): void {
  const qc = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !postId) return;

    const join = () => socket.emit('subscribe:post', postId);
    if (socket.connected) join();
    socket.on('connect', join);

    const onChange = () => {
      qc.invalidateQueries({ queryKey: commentKeys.list(postId) });
    };
    for (const evt of COMMENT_EVENTS) socket.on(evt, onChange);

    return () => {
      socket.emit('unsubscribe:post', postId);
      socket.off('connect', join);
      for (const evt of COMMENT_EVENTS) socket.off(evt, onChange);
    };
  }, [socket, postId, qc]);
}
