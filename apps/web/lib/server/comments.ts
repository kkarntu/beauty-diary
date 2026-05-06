import 'server-only';

import type { CommentDto } from '@beauty-diary/shared';
import { serverFetch } from './fetch';

export async function fetchCommentsByPostId(postId: string): Promise<CommentDto[]> {
  return serverFetch<CommentDto[]>(`/api/posts/${encodeURIComponent(postId)}/comments`);
}
