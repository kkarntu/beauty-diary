import type { RefreshToken } from '../refresh-token.entity';

export interface RefreshTokenRepository {
  findById(id: string): Promise<RefreshToken | null>;
  save(token: RefreshToken): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
