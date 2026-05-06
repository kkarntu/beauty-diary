import { z } from 'zod';
import { LIMITS } from '../constants';
import { UserRole } from '../enums';

export const PublicUserDto = z.object({
  id: z.string().uuid(),
  nickname: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  followersCount: z.number().int().nonnegative().default(0),
  followingCount: z.number().int().nonnegative().default(0),
  /** True when the requesting user is following this profile. False for anonymous viewers. */
  isFollowedByMe: z.boolean().default(false),
});
export type PublicUserDto = z.infer<typeof PublicUserDto>;

export const CurrentUserDto = PublicUserDto.extend({
  email: z.string().email(),
  role: z.enum([UserRole.USER, UserRole.ADMIN]),
  emailVerifiedAt: z.string().datetime().nullable(),
});
export type CurrentUserDto = z.infer<typeof CurrentUserDto>;

export const UpdateProfileDto = z.object({
  displayName: z.string().max(LIMITS.NICKNAME_MAX).nullable().optional(),
  bio: z.string().max(LIMITS.BIO_MAX).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileDto>;
