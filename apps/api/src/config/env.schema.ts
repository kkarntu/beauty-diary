import { z } from 'zod';

const booleanString = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : v.toLowerCase() === 'true'));

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(23001),
  WEB_ORIGIN: z.string().url(),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  COOKIE_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: booleanString.default(false),

  // SMTP — used by NodemailerMailer when MAIL_DRIVER=smtp.
  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: booleanString.default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().min(1),

  // Resend HTTP API — used by ResendMailer when MAIL_DRIVER=resend.
  // Required only when MAIL_DRIVER=resend.
  MAIL_DRIVER: z.enum(['smtp', 'resend']).default('smtp'),
  RESEND_API_KEY: z.string().optional(),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: booleanString.default(true),
  S3_PUBLIC_URL: z.string().url(),

  LOG_LEVEL: z.enum(['error', 'warn', 'log', 'debug', 'verbose']).default('log'),
  RATE_LIMIT_AUTH_PER_MINUTE: z.coerce.number().int().min(1).default(10),

  // Auto-seeded admin account, created on boot if no admin exists yet.
  // Both must be set for seeding to run.
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(8).optional(),
  ADMIN_SEED_NICKNAME: z.string().min(2).max(32).default('admin'),
});

export type Env = z.infer<typeof EnvSchema>;
