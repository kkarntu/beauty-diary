import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCommentStream } from './comment-stream';
import { commentKeys } from './comments';

interface MockSocket {
  connected: boolean;
  emit: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  /** Test helper — invokes whatever was registered via `socket.on(event, cb)`. */
  fire(event: string, ...args: unknown[]): void;
  /** Listeners by event name, populated by `on`. */
  listeners: Map<string, ((...args: unknown[]) => void)[]>;
}

function makeSocket(connected = true): MockSocket {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  return {
    connected,
    listeners,
    emit: vi.fn(),
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

let activeSocket: MockSocket | null;
vi.mock('@/lib/realtime/socket-context', () => ({
  useSocket: () => activeSocket,
}));

describe('useCommentStream', () => {
  beforeEach(() => {
    activeSocket = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function wrapper(qc: QueryClient) {
    function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    }
    return Wrapper;
  }

  it('joins the post room and invalidates the comments query on push', async () => {
    activeSocket = makeSocket(true);
    const qc = new QueryClient();
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    renderHook(() => useCommentStream('post-42'), { wrapper: wrapper(qc) });

    expect(activeSocket.emit).toHaveBeenCalledWith('subscribe:post', 'post-42');

    activeSocket.fire('comment:created', { commentId: 'c1', postId: 'post-42' });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: commentKeys.list('post-42'),
      }),
    );
  });

  it('emits unsubscribe and removes the listener on unmount', () => {
    activeSocket = makeSocket(true);
    const qc = new QueryClient();
    const { unmount } = renderHook(() => useCommentStream('post-7'), {
      wrapper: wrapper(qc),
    });
    unmount();
    expect(activeSocket.emit).toHaveBeenCalledWith('unsubscribe:post', 'post-7');
    expect(activeSocket.off).toHaveBeenCalledWith('comment:created', expect.any(Function));
  });

  it('is a no-op when there is no socket (anonymous user)', () => {
    activeSocket = null;
    const qc = new QueryClient();
    expect(() =>
      renderHook(() => useCommentStream('post-1'), { wrapper: wrapper(qc) }),
    ).not.toThrow();
  });
});
