import type { PostListResponseDto } from '@beauty-diary/shared';

export class ListFavoritesQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly pageSize: number,
  ) {}
}

export type ListFavoritesResult = PostListResponseDto;
