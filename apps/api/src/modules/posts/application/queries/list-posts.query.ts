import type { PostListResponseDto, PostStatus } from '@beauty-diary/shared';

export class ListPostsQuery {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly sort: 'recent' | 'popular',
    public readonly categorySlug?: string,
    public readonly tagSlug?: string,
    public readonly authorNickname?: string,
    public readonly currentUserId?: string,
    public readonly q?: string,
    public readonly ownAuthorId?: string,
    public readonly status?: PostStatus,
  ) {}
}

export type ListPostsResult = PostListResponseDto;
