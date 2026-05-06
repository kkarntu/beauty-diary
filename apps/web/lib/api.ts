'use client';

import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

/**
 * Browser-side API client.
 *
 * `withCredentials: true` makes the browser send the httpOnly session
 * cookies (`bd_at`, `bd_rt`) on every request and pick up Set-Cookie
 * headers from `/auth/login` etc.
 *
 * The 401 interceptor performs at most one transparent refresh per
 * request and coordinates across browser tabs via `navigator.locks` +
 * a localStorage timestamp. Without that coordination, two tabs that
 * 401 simultaneously would both call `/auth/refresh`; the second one
 * would re-use the just-rotated refresh token and trigger the
 * server-side reuse-detection that revokes the entire session.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

const SHOULD_NOT_RETRY = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout'];

const REFRESH_TIMESTAMP_KEY = 'bd:lastRefreshAt';
/** Skip refresh if another tab refreshed within this window. */
const REFRESH_DEBOUNCE_MS = 5_000;
/** In-tab dedupe — multiple parallel 401s wait on the same promise. */
let inFlightRefresh: Promise<void> | null = null;

async function refreshOnce(): Promise<void> {
  // Cross-tab serialization. Without this, two tabs racing on a 401
  // can both POST /auth/refresh — the loser sends the now-revoked
  // refresh token and the server treats it as a leak.
  const supportsLocks = typeof navigator !== 'undefined' && 'locks' in navigator;
  const work = async (): Promise<void> => {
    const lastStr = typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TIMESTAMP_KEY) : null;
    const last = lastStr ? Number(lastStr) : 0;
    if (Date.now() - last < REFRESH_DEBOUNCE_MS) {
      // Cookies were just rotated by another tab — skip the network call.
      return;
    }
    await api.post('/api/auth/refresh');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(REFRESH_TIMESTAMP_KEY, String(Date.now()));
    }
  };

  if (supportsLocks) {
    await navigator.locks.request('bd:auth-refresh', { mode: 'exclusive' }, work);
    return;
  }
  await work();
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (
      !original ||
      original._retried ||
      error.response?.status !== 401 ||
      SHOULD_NOT_RETRY.some((p) => original.url?.includes(p))
    ) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      if (!inFlightRefresh) {
        inFlightRefresh = refreshOnce().finally(() => {
          inFlightRefresh = null;
        });
      }
      await inFlightRefresh;
      return api(original as AxiosRequestConfig);
    } catch {
      return Promise.reject(error);
    }
  },
);

/** Extract the API's `code` field from an Axios error response, if present. */
export function getApiErrorCode(err: unknown): string | null {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { code?: string } | undefined;
    return data?.code ?? null;
  }
  return null;
}
