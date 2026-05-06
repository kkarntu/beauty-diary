import { z } from 'zod';

export const NotificationPreferencesDto = z.object({
  newFollower: z.boolean(),
  newComment: z.boolean(),
  newLike: z.boolean(),
  newsletter: z.boolean(),
});
export type NotificationPreferencesDto = z.infer<typeof NotificationPreferencesDto>;

export const UpdateNotificationPreferencesDto = NotificationPreferencesDto.partial();
export type UpdateNotificationPreferencesDto = z.infer<typeof UpdateNotificationPreferencesDto>;
