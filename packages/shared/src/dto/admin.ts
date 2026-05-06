import { z } from 'zod';
import { PAGINATION } from '../constants';
import { UserRole } from '../enums';

export const UpdateUserStateDto = z
  .object({
    isBlocked: z.boolean().optional(),
    role: z.enum([UserRole.USER, UserRole.ADMIN]).optional(),
  })
  .refine((v) => v.isBlocked !== undefined || v.role !== undefined, {
    message: 'At least one of isBlocked or role must be provided',
  });
export type UpdateUserStateDto = z.infer<typeof UpdateUserStateDto>;

export const AdminUserListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  role: z.enum([UserRole.USER, UserRole.ADMIN]).optional(),
  isBlocked: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) =>
      typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : undefined,
    ),
  search: z.string().optional(),
});
export type AdminUserListQueryDto = z.infer<typeof AdminUserListQueryDto>;

export const AdminUserDto = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nickname: z.string(),
  displayName: z.string().nullable(),
  role: z.enum([UserRole.USER, UserRole.ADMIN]),
  isBlocked: z.boolean(),
  emailVerifiedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type AdminUserDto = z.infer<typeof AdminUserDto>;

export const AdminUserListResponseDto = z.object({
  items: z.array(AdminUserDto),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type AdminUserListResponseDto = z.infer<typeof AdminUserListResponseDto>;

export const AuditLogQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  action: z.string().optional(),
  targetType: z.string().optional(),
});
export type AuditLogQueryDto = z.infer<typeof AuditLogQueryDto>;

export const AuditLogEntryDto = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  actorNickname: z.string().nullable(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().uuid().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type AuditLogEntryDto = z.infer<typeof AuditLogEntryDto>;

export const AuditLogListResponseDto = z.object({
  items: z.array(AuditLogEntryDto),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type AuditLogListResponseDto = z.infer<typeof AuditLogListResponseDto>;
