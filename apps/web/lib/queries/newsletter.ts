'use client';

import type { SubscribeNewsletterDto } from '@beauty-diary/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: async (input: SubscribeNewsletterDto) => {
      await api.post('/api/newsletter/subscribe', input);
    },
  });
}
