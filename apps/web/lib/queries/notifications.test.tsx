import type { NotificationListResponseDto } from '@beauty-diary/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationKeys, useNotificationStream } from './notifications';

interface MockSocket {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  fire(event: string, ...args: unknown[]): void;
  listeners: Map<string, ((...args: unknown[]) => void)[]>;
}

function makeSocket(): MockSocket {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  return {
    listeners,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      const arr = listeners.get(event) ?? [];
      arr.push(cb);
      listeners.set(event, arr);
    }),
    off: vi.fn(),
    fire(event: string, ...args: unknown[]) {
      const arr = listeners.get(event) ?? [];
      for (const cb of arr) cb(...args);
    },
  };
}

let socket: MockSocket | null = null;
vi.mock('@/lib/realtime/socket-context', () => ({
  useSocket: () => socket,
}));

describe('useNotificationStream', () => {
  beforeEach(() => {
    socket = makeSocket();
  });

  function wrapper(qc: QueryClient) {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  }

  it('prepends an incoming notification to the cached list and bumps the unread count', () => {
    const qc = new QueryClient();
    const seedList: NotificationListResponseDto = {
      items: [],
      total: 0,
      unreadCount: 0,
      page: 1,
      pageSize: 20,
    };
    qc.setQueryData(notificationKeys.list(), seedList);
    qc.setQueryData(notificationKeys.unread(), 0);

    renderHook(() => useNotificationStream(), { wrapper: wrapper(qc) });

    expect(socket!.on).toHaveBeenCalledWith('notification:created', expect.any(Function));

    socket!.fire('notification:created', {
      id: 'n1',
      type: 'comment.created',
      payload: { commentId: 'c1' },
      readAt: null,
      createdAt: new Date().toISOString(),
    });

    const list = qc.getQueryData<NotificationListResponseDto>(notificationKeys.list());
    expect(list?.items).toHaveLength(1);
    expect(list?.unreadCount).toBe(1);
    expect(qc.getQueryData<number>(notificationKeys.unread())).toBe(1);
  });
});
