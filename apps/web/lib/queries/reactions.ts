'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLikePost() {
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.put(`/api/posts/${postId}/like`);
    },
  });
}

export function useUnlikePost() {
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/api/posts/${postId}/like`);
    },
  });
}

export function useFavoritePost() {
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.put(`/api/posts/${postId}/favorite`);
    },
  });
}

export function useUnfavoritePost() {
  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/api/posts/${postId}/favorite`);
    },
  });
}
