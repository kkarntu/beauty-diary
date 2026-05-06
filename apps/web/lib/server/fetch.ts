import 'server-only';

import { cookies } from 'next/headers';

/**
 * Server-side fetch wrapper that forwards the request's cookies to the API.
 * Using `fetch` (not axios) lets Next.js dedupe identical requests inside
 * a single RSC render and gives us proper cache controls.
 */
export async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const baseUrl = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('API_INTERNAL_URL or NEXT_PUBLIC_API_URL must be set');
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...init.headers,
    },
    // Pages that show personalised data should not be cached on Next's side.
    cache: init.cache ?? 'no-store',
  });

  if (!res.ok) {
    throw new ServerFetchError(path, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export class ServerFetchError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number,
  ) {
    super(`API ${path} returned ${status}`);
    this.name = 'ServerFetchError';
  }
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ServerFetchError && err.status === 404;
}
