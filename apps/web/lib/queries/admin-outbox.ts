'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRetryOutbox() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/admin/email-outbox/${encodeURIComponent(id)}/retry`);
    },
  });
}
