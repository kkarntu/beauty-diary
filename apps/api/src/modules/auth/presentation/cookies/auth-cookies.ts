import type { Response } from 'express';
import type { EnvService } from '../../../../config/env.service';

export const ACCESS_COOKIE_NAME = 'bd_at';
export const REFRESH_COOKIE_NAME = 'bd_rt';

const REFRESH_PATH = '/api/auth';

interface CookieAttrs {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax' | 'none';
  domain?: string;
  path: string;
}

/**
 * In production the web (vercel.app) and api (onrender.com) live on
 * different eTLD+1 origins, so the auth cookies must be `SameSite=None`
 * to be attached to cross-site `fetch` calls. `SameSite=None` is only
 * accepted by browsers when paired with `Secure=true`, which is exactly
 * what `COOKIE_SECURE=true` already gives us in production.
 *
 * In dev (`COOKIE_SECURE=false`) we keep `SameSite=Lax` since the web +
 * api both live on `localhost` (same site, different ports).
 */
function baseAttrs(env: EnvService, path: string): CookieAttrs {
  const attrs: CookieAttrs = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? 'none' : 'lax',
    path,
  };
  if (env.cookieDomain && env.cookieDomain !== 'localhost') {
    attrs.domain = env.cookieDomain;
  }
  return attrs;
}

function ttlFromString(ttl: string): number {
  // Supports "15m", "30d", "12h", "60s". Falls back to 15 minutes.
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 15 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return n * 1000;
    case 'm':
      return n * 60 * 1000;
    case 'h':
      return n * 60 * 60 * 1000;
    case 'd':
      return n * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000;
  }
}

export function writeAuthCookies(
  res: Response,
  env: EnvService,
  tokens: {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
  },
): void {
  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
    ...baseAttrs(env, '/'),
    maxAge: ttlFromString(env.jwtAccessTtl),
  });
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...baseAttrs(env, REFRESH_PATH),
    expires: tokens.refreshTokenExpiresAt,
  });
}

export function clearAuthCookies(res: Response, env: EnvService): void {
  res.clearCookie(ACCESS_COOKIE_NAME, baseAttrs(env, '/'));
  res.clearCookie(REFRESH_COOKIE_NAME, baseAttrs(env, REFRESH_PATH));
}
