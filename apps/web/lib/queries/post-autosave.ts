'use client';

import type { UpdatePostDto } from '@beauty-diary/shared';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export type AutoSaveStatus = 'idle' | 'pending' | 'saved' | 'error';

interface Options {
  postId: string | undefined;
  payload: UpdatePostDto;
  /** Disable when invalid; auto-save shouldn't fire on partial form state. */
  enabled: boolean;
  /** Debounce window in ms — defaults to 2.5s. */
  debounceMs?: number;
}

/**
 * Debounced autosave for the post editor in edit mode. Watches `payload`
 * and PATCHes the API after `debounceMs` of no changes.
 *
 * The hook is no-op for new posts (no postId) — auto-save only kicks in
 * after the first explicit "Save draft" creates the row.
 */
export function useAutoSaveDraft({ postId, payload, enabled, debounceMs = 2500 }: Options): {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
} {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerialized = useRef<string>('');
  // First render captures the initial form state — don't immediately save it.
  const primed = useRef(false);

  useEffect(() => {
    if (!postId || !enabled) return;

    const serialized = JSON.stringify(payload);
    if (!primed.current) {
      primed.current = true;
      lastSerialized.current = serialized;
      return;
    }
    if (serialized === lastSerialized.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setStatus('pending');
        await api.patch(`/api/posts/${postId}`, payload);
        lastSerialized.current = serialized;
        setLastSavedAt(new Date());
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [postId, payload, enabled, debounceMs]);

  return { status, lastSavedAt };
}
