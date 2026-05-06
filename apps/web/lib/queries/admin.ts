'use client';

import type { UpdateUserStateDto } from '@beauty-diary/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUpdateUserState() {
  return useMutation({
    mutationFn: async ({
      userId,
      patch,
    }: {
      userId: string;
      patch: UpdateUserStateDto;
    }) => {
      await api.patch(`/api/admin/users/${userId}`, patch);
    },
  });
}
