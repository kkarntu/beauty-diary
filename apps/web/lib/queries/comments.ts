'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommentDto, CreateCommentDto, UpdateCommentDto } from '@beauty-diary/shared';
import { api } from '@/lib/api';

export const commentKeys = {
  list: (postId: string) => ['comments', postId] as const,
};

export function useComments(postId: string, initialData?: CommentDto[]) {
  return useQuery({
    queryKey: commentKeys.list(postId),
    queryFn: async () => {
      const res = await api.get<CommentDto[]>(`/api/posts/${postId}/comments`);
      return res.data;
    },
    initialData,
    staleTime: 30_000,
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCommentDto) => {
      const res = await api.post<{ id: string }>(`/api/posts/${postId}/comments`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.list(postId) }),
  });
}

export function useUpdateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, data }: { commentId: string; data: UpdateCommentDto }) => {
      await api.patch(`/api/posts/${postId}/comments/${commentId}`, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.list(postId) }),
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/api/posts/${postId}/comments/${commentId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentKeys.list(postId) }),
  });
}
