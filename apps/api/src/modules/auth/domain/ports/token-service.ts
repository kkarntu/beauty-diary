import type { UserRole } from '@beauty-diary/shared';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface IssuedRefreshToken {
  id: string;
  rawJwt: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface TokenService {
  issueAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;

  issueRefreshToken(userId: string): IssuedRefreshToken;
  verifyRefreshToken(token: string): RefreshTokenPayload;
  hashRefreshToken(rawJwt: string): string;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
