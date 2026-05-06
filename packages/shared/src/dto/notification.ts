import { z } from 'zod';

export const NotificationType = {
  COMMENT_CREATED: 'comment.created',
  USER_FOLLOWED: 'user.followed',
  POST_LIKED: 'post.liked',
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationDto = z.object({
  id: z.string().uuid(),
  type: z.enum([
    NotificationType.COMMENT_CREATED,
    NotificationType.USER_FOLLOWED,
    NotificationType.POST_LIKED,
  ]),
  payload: z.record(z.unknown()),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type NotificationDto = z.infer<typeof NotificationDto>;

export const NotificationListResponseDto = z.object({
  items: z.array(NotificationDto),
  unreadCount: z.number().int().nonnegative(),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type NotificationListResponseDto = z.infer<typeof NotificationListResponseDto>;
