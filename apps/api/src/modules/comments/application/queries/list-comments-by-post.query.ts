import type { CommentDto } from '@beauty-diary/shared';

export class ListCommentsByPostQuery {
  constructor(public readonly postId: string) {}
}

export type ListCommentsByPostResult = CommentDto[];
