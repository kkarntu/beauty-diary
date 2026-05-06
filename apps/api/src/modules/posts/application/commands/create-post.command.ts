import type { PostStatus } from '@beauty-diary/shared';

export class CreatePostCommand {
  constructor(
    public readonly authorId: string,
    public readonly title: string,
    public readonly contentHtml: string,
    public readonly categoryId: string,
    public readonly tagSlugs: string[],
    public readonly excerpt: string | null,
    public readonly coverImageUrl: string | null,
    public readonly status: PostStatus,
    public readonly allowComments: boolean = true,
    public readonly showInFeed: boolean = true,
  ) {}
}

export interface CreatePostResult {
  id: string;
  slug: string;
}
