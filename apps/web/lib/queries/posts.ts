'use client';

import { useMutation } from '@tanstack/react-query';
import type { CreatePostDto, UpdatePostDto } from '@beauty-diary/shared';
import { api } from '@/lib/api';

export function useCreatePost() {
  return useMutation({
    mutationFn: async (data: CreatePostDto) => {
      const res = await api.post<{ id: string; slug: string }>('/api/posts', data);
      return res.data;
    },
  });
}

export function useUpdatePost(postId: string) {
  return useMutation({
    mutationFn: async (data: UpdatePostDto) => {
      await api.patch(`/api/posts/${postId}`, data);
    },
  });
}

export function useDeletePost() {
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/api/posts/${postId}`);
    },
  });
}

export function usePublishPost() {
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.post(`/api/posts/${postId}/publish`);
    },
  });
}

export function useArchivePost() {
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.post(`/api/posts/${postId}/archive`);
    },
  });
}
