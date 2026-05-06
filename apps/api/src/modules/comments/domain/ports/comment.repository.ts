import type { Comment } from '../comment.entity';

export interface CommentListRow {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
  };
}

export interface CommentRepository {
  findById(id: string): Promise<Comment | null>;
  save(comment: Comment): Promise<void>;
  listByPostId(postId: string): Promise<CommentListRow[]>;
}

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');
