import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useAutoSaveDraft } from './post-autosave';

vi.mock('@/lib/api', () => ({
  api: { patch: vi.fn() },
}));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('useAutoSaveDraft', () => {
  beforeEach(() => {
    (api.patch as ReturnType<typeof vi.fn>).mockReset();
    (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing on the initial render — only saves after a real change', async () => {
    renderHook(() =>
      useAutoSaveDraft({
        postId: 'p1',
        payload: { title: 'Hello', contentHtml: '<p>x</p>' },
        enabled: true,
        debounceMs: 50,
      }),
    );

    await sleep(150);
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('debounces — fires PATCH once after changes settle', async () => {
    const { rerender } = renderHook(
      ({ payload }) =>
        useAutoSaveDraft({ postId: 'p1', payload, enabled: true, debounceMs: 50 }),
      { initialProps: { payload: { title: 'Hello', contentHtml: '<p>x</p>' } } },
    );

    rerender({ payload: { title: 'Hello world', contentHtml: '<p>x</p>' } });

    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenCalledWith('/api/posts/p1', {
      title: 'Hello world',
      contentHtml: '<p>x</p>',
    });
  });

  it('does not fire when there is no postId (post is still being created)', async () => {
    const { rerender } = renderHook(
      ({ payload }) =>
        useAutoSaveDraft({ postId: undefined, payload, enabled: true, debounceMs: 50 }),
      { initialProps: { payload: { title: 'Hello' } } },
    );

    rerender({ payload: { title: 'Hello world' } });
    await sleep(150);
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('does not fire when disabled (form invalid)', async () => {
    const { rerender } = renderHook(
      ({ payload, enabled }) =>
        useAutoSaveDraft({ postId: 'p1', payload, enabled, debounceMs: 50 }),
      { initialProps: { payload: { title: 'Hello' }, enabled: false } },
    );

    rerender({ payload: { title: 'Hello world' }, enabled: false });
    await sleep(150);
    expect(api.patch).not.toHaveBeenCalled();
  });
});
