'use client';

import type {
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from '@beauty-diary/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const notificationPrefKeys = {
  current: () => ['notification-preferences'] as const,
};

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationPrefKeys.current(),
    queryFn: async () => {
      const res = await api.get<NotificationPreferencesDto>('/api/me/notification-preferences');
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: UpdateNotificationPreferencesDto) => {
      const res = await api.patch<NotificationPreferencesDto>(
        '/api/me/notification-preferences',
        patch,
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(notificationPrefKeys.current(), data);
    },
  });
}
