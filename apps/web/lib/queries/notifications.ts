'use client';

import type { NotificationDto, NotificationListResponseDto } from '@beauty-diary/shared';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/realtime/socket-context';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const res = await api.get<NotificationListResponseDto>(
        '/api/me/notifications?page=1&pageSize=20',
      );
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const res = await api.get<{ unreadCount: number }>('/api/me/notifications/unread-count');
      return res.data.unreadCount;
    },
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead(): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/me/notifications/${encodeURIComponent(id)}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead(): UseMutationResult<void, unknown, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/api/me/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Subscribes to `notification:created` pushes on the user's WS room and
 * patches the cached list/unread-count, so the bell icon updates in
 * real time without polling.
 */
export function useNotificationStream(): void {
  const qc = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const onCreated = (data: NotificationDto) => {
      qc.setQueryData<NotificationListResponseDto | undefined>(notificationKeys.list(), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: [data, ...prev.items].slice(0, prev.pageSize),
          unreadCount: prev.unreadCount + 1,
          total: prev.total + 1,
        };
      });
      qc.setQueryData<number | undefined>(notificationKeys.unread(), (prev) =>
        typeof prev === 'number' ? prev + 1 : prev,
      );
    };
    socket.on('notification:created', onCreated);
    return () => {
      socket.off('notification:created', onCreated);
    };
  }, [socket, qc]);
}
