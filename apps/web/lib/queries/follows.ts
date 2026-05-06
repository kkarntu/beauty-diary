'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useFollowUser() {
  return useMutation({
    mutationFn: async (nickname: string) => {
      await api.post(`/api/users/${encodeURIComponent(nickname)}/follow`);
    },
  });
}

export function useUnfollowUser() {
  return useMutation({
    mutationFn: async (nickname: string) => {
      await api.delete(`/api/users/${encodeURIComponent(nickname)}/follow`);
    },
  });
}
