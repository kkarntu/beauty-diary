'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` only after the component has mounted on the client.
 *
 * Use this to gate UI that varies based on client-only state (auth,
 * theme, locale-formatted dates) and would otherwise produce a
 * hydration mismatch — the SSR pass and the very first client render
 * both see `false`, so the rendered HTML matches.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
