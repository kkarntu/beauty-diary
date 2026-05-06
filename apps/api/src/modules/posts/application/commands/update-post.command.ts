import type { UserRole } from '@beauty-diary/shared';

export interface UpdatePostInput {
  title?: string;
  excerpt?: string | null;
  contentHtml?: string;
  coverImageUrl?: string | null;
  categoryId?: string;
  tagSlugs?: string[];
  allowComments?: boolean;
  showInFeed?: boolean;
}

export class UpdatePostCommand {
  constructor(
    public readonly postId: string,
    public readonly actorId: string,
    public readonly actorRole: UserRole,
    public readonly input: UpdatePostInput,
  ) {}
}
