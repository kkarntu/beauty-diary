import 'server-only';

import type { PostDetailDto, PostListQueryDto, PostListResponseDto } from '@beauty-diary/shared';
import { serverFetch } from './fetch';

export async function fetchPosts(
  query: Partial<PostListQueryDto> = {},
): Promise<PostListResponseDto> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v));
    }
  }
  const qs = params.toString();
  return serverFetch<PostListResponseDto>(`/api/posts${qs ? `?${qs}` : ''}`);
}

export async function fetchPostBySlug(slug: string): Promise<PostDetailDto> {
  return serverFetch<PostDetailDto>(`/api/posts/${encodeURIComponent(slug)}`);
}
