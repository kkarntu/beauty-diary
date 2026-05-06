import type { PostDetailDto } from '@beauty-diary/shared';

export class GetPostBySlugQuery {
  constructor(
    public readonly slug: string,
    public readonly currentUserId?: string,
  ) {}
}

export type GetPostBySlugResult = PostDetailDto;
