import { Injectable } from '@nestjs/common';
import type { Env } from './env.schema';

/**
 * Typed accessor for validated environment variables.
 *
 * Don't read from `process.env` outside this service — going through here
 * guarantees the value was validated by EnvSchema at boot.
 */
@Injectable()
export class EnvService {
  constructor(private readonly env: Env) {}

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.env.NODE_ENV;
  }

  get port(): number {
    return this.env.PORT;
  }

  get webOrigin(): string {
    return this.env.WEB_ORIGIN;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get jwtAccessSecret(): string {
    return this.env.JWT_ACCESS_SECRET;
  }

  get jwtRefreshSecret(): string {
    return this.env.JWT_REFRESH_SECRET;
  }

  get jwtAccessTtl(): string {
    return this.env.JWT_ACCESS_TTL;
  }

  get jwtRefreshTtl(): string {
    return this.env.JWT_REFRESH_TTL;
  }

  get cookieSecret(): string {
    return this.env.COOKIE_SECRET;
  }

  get cookieDomain(): string {
    return this.env.COOKIE_DOMAIN;
  }

  get cookieSecure(): boolean {
    return this.env.COOKIE_SECURE;
  }

  get smtp(): {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  } {
    return {
      host: this.env.SMTP_HOST,
      port: this.env.SMTP_PORT,
      secure: this.env.SMTP_SECURE,
      user: this.env.SMTP_USER,
      pass: this.env.SMTP_PASS,
      from: this.env.MAIL_FROM,
    };
  }

  get s3(): {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle: boolean;
    publicUrl: string;
  } {
    return {
      endpoint: this.env.S3_ENDPOINT,
      region: this.env.S3_REGION,
      bucket: this.env.S3_BUCKET,
      accessKeyId: this.env.S3_ACCESS_KEY_ID,
      secretAccessKey: this.env.S3_SECRET_ACCESS_KEY,
      forcePathStyle: this.env.S3_FORCE_PATH_STYLE,
      publicUrl: this.env.S3_PUBLIC_URL,
    };
  }

  get rateLimitAuthPerMinute(): number {
    return this.env.RATE_LIMIT_AUTH_PER_MINUTE;
  }

  get logLevel(): Env['LOG_LEVEL'] {
    return this.env.LOG_LEVEL;
  }

  get mailDriver(): 'smtp' | 'brevo' {
    return this.env.MAIL_DRIVER;
  }

  get brevoApiKey(): string | undefined {
    return this.env.BREVO_API_KEY;
  }

  get adminSeed(): { email: string; password: string; nickname: string } | null {
    if (!this.env.ADMIN_SEED_EMAIL || !this.env.ADMIN_SEED_PASSWORD) return null;
    return {
      email: this.env.ADMIN_SEED_EMAIL,
      password: this.env.ADMIN_SEED_PASSWORD,
      nickname: this.env.ADMIN_SEED_NICKNAME,
    };
  }
}
