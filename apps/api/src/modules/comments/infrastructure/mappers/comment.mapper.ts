import { Comment } from '../../domain/comment.entity';
import type { CommentOrmEntity } from '../persistence/comment.orm-entity';

export class CommentMapper {
  static toDomain(orm: CommentOrmEntity): Comment {
    return Comment.rehydrate({
      id: orm.id,
      postId: orm.postId,
      authorId: orm.authorId,
      parentId: orm.parentId,
      content: orm.content,
      editedAt: orm.editedAt,
      deletedAt: orm.deletedAt,
      createdAt: orm.createdAt,
    });
  }
}
