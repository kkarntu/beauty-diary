import type { MetadataRoute } from 'next';
import { fetchPosts } from '@/lib/server/posts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:23000';
const STATIC_PATHS = ['', '/feed', '/login', '/register', '/forgot-password'];
const CATEGORY_SLUGS = ['skincare', 'makeup', 'hair', 'wellness', 'fashion', 'lifestyle'];

/**
 * Combined sitemap for both locales. Posts are fetched in batches of 100
 * up to a soft cap of 1000 entries to keep the route fast at build time.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of ['uk', 'en'] as const) {
    const prefix = locale === 'uk' ? '' : '/en';

    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}${prefix}${path}`,
        lastModified: now,
        changeFrequency: path === '' || path === '/feed' ? 'daily' : 'monthly',
      });
    }

    for (const slug of CATEGORY_SLUGS) {
      entries.push({
        url: `${SITE_URL}${prefix}/category/${slug}`,
        lastModified: now,
        changeFrequency: 'daily',
      });
    }
  }

  // Posts — paginate until exhaustion or until we hit the soft cap.
  let page = 1;
  const seen = new Set<string>();
  while (page <= 10) {
    let response;
    try {
      response = await fetchPosts({ page, pageSize: 100, sort: 'recent' });
    } catch {
      break;
    }
    if (response.items.length === 0) break;
    for (const post of response.items) {
      if (seen.has(post.slug)) continue;
      seen.add(post.slug);
      const lastModified = post.publishedAt ?? now;
      entries.push({
        url: `${SITE_URL}/posts/${post.slug}`,
        lastModified,
        changeFrequency: 'weekly',
      });
      entries.push({
        url: `${SITE_URL}/en/posts/${post.slug}`,
        lastModified,
        changeFrequency: 'weekly',
      });
    }
    if (response.items.length < 100) break;
    page += 1;
  }

  return entries;
}
