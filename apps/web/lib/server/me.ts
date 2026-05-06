import 'server-only';

import type { CurrentUserDto, PostListResponseDto } from '@beauty-diary/shared';
import { serverFetch } from './fetch';

export async function fetchCurrentUser(): Promise<CurrentUserDto | null> {
  try {
    return await serverFetch<CurrentUserDto>('/api/auth/me');
  } catch {
    return null;
  }
}

export async function fetchMyFavorites(page = 1, pageSize = 12): Promise<PostListResponseDto> {
  return serverFetch<PostListResponseDto>(`/api/me/favorites?page=${page}&pageSize=${pageSize}`);
}
