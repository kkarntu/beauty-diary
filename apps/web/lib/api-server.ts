import 'server-only';

import axios, { type AxiosInstance } from 'axios';
import { cookies } from 'next/headers';

/**
 * Server-side API client (RSC, route handlers, server actions).
 *
 * Forwards the request's cookies to the API so the existing session
 * works in Server Components. `API_INTERNAL_URL` lets prod use a
 * private network URL when the api and web are co-deployed; in dev it
 * falls back to NEXT_PUBLIC_API_URL.
 */
export async function apiServer(): Promise<AxiosInstance> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  return axios.create({
    baseURL: process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });
}
