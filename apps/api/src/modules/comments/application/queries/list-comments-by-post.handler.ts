import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { COMMENT_REPOSITORY, type CommentRepository } from '../../domain/ports/comment.repository';
import {
  ListCommentsByPostQuery,
  type ListCommentsByPostResult,
} from './list-comments-by-post.query';

@QueryHandler(ListCommentsByPostQuery)
export class ListCommentsByPostHandler implements IQueryHandler<
  ListCommentsByPostQuery,
  ListCommentsByPostResult
> {
  constructor(@Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepository) {}

  async execute(query: ListCommentsByPostQuery): Promise<ListCommentsByPostResult> {
    const rows = await this.comments.listByPostId(query.postId);
    return rows.map((row) => ({
      id: row.id,
      postId: row.postId,
      parentId: row.parentId,
      content: row.content,
      author: row.author,
      createdAt: row.createdAt.toISOString(),
      editedAt: row.editedAt ? row.editedAt.toISOString() : null,
    }));
  }
}
