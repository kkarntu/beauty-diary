import { z } from 'zod';
import { LIMITS } from '../constants';

export const CreateCommentDto = z.object({
  content: z.string().min(1).max(LIMITS.COMMENT_MAX),
  parentId: z.string().uuid().nullable().optional(),
});
export type CreateCommentDto = z.infer<typeof CreateCommentDto>;

export const UpdateCommentDto = z.object({
  content: z.string().min(1).max(LIMITS.COMMENT_MAX),
});
export type UpdateCommentDto = z.infer<typeof UpdateCommentDto>;

export const CommentDto = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  content: z.string(),
  author: z.object({
    id: z.string().uuid(),
    nickname: z.string(),
    avatarUrl: z.string().url().nullable(),
  }),
  createdAt: z.string().datetime(),
  editedAt: z.string().datetime().nullable(),
});
export type CommentDto = z.infer<typeof CommentDto>;
