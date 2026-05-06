import 'server-only';

import type { TrendingTagDto } from '@beauty-diary/shared';
import { serverFetch } from './fetch';

export async function fetchTrendingTags(limit = 8): Promise<TrendingTagDto[]> {
  try {
    return await serverFetch<TrendingTagDto[]>(`/api/tags/trending?limit=${limit}`);
  } catch {
    // Sidebar is non-critical — fall back to empty list if the API is down.
    return [];
  }
}
