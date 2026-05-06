import 'server-only';

import type { CategoryDto } from '@beauty-diary/shared';
import { serverFetch } from './fetch';

export async function fetchCategories(): Promise<CategoryDto[]> {
  // Categories almost never change; cache for 1 hour at the Next layer.
  return serverFetch<CategoryDto[]>('/api/categories', { cache: 'force-cache', next: { revalidate: 3600 } });
}
