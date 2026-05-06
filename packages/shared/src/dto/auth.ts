import { z } from 'zod';
import { LIMITS } from '../constants';

export const RegisterDto = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(LIMITS.PASSWORD_MIN).max(LIMITS.PASSWORD_MAX),
  nickname: z
    .string()
    .min(LIMITS.NICKNAME_MIN)
    .max(LIMITS.NICKNAME_MAX)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, underscore, hyphen only'),
});
export type RegisterDto = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginDto>;

export const RequestPasswordResetDto = z.object({
  email: z.string().email().toLowerCase(),
});
export type RequestPasswordResetDto = z.infer<typeof RequestPasswordResetDto>;

export const ResetPasswordDto = z.object({
  token: z.string().min(1),
  password: z.string().min(LIMITS.PASSWORD_MIN).max(LIMITS.PASSWORD_MAX),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;
