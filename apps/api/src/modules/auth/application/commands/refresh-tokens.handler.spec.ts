import { User } from '../../../users/domain/user.entity';
import type { UserRepository } from '../../../users/domain/ports/user.repository';
import {
  AccountBlockedError,
  InvalidRefreshTokenError,
  RefreshTokenReusedError,
} from '../../domain/auth.errors';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository';
import type { TokenService } from '../../domain/ports/token-service';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { RefreshTokensCommand } from './refresh-tokens.command';
import { RefreshTokensHandler } from './refresh-tokens.handler';

describe('RefreshTokensHandler', () => {
  const make = () => {
    const users: jest.Mocked<UserRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByNickname: jest.fn(),
      save: jest.fn(),
    };
    const refreshTokens: jest.Mocked<RefreshTokenRepository> = {
      findById: jest.fn(),
      save: jest.fn(),
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn(),
    };
    const tokens: jest.Mocked<TokenService> = {
      issueAccessToken: jest.fn().mockReturnValue('new.access'),
      verifyAccessToken: jest.fn(),
      issueRefreshToken: jest.fn().mockReturnValue({
        id: 'new-rt-id',
        rawJwt: 'new.refresh.jwt',
        tokenHash: 'new-hash',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
      verifyRefreshToken: jest.fn(),
      hashRefreshToken: jest.fn(),
    };
    return {
      users,
      refreshTokens,
      tokens,
      handler: new RefreshTokensHandler(users, refreshTokens, tokens),
    };
  };

  const validStored = (overrides: Partial<{ revokedAt: Date }> = {}) =>
    RefreshToken.rehydrate({
      id: 'rt-1',
      userId: 'u1',
      tokenHash: 'stored-hash',
      userAgent: null,
      ip: null,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: overrides.revokedAt ?? null,
      replacedBy: null,
      createdAt: new Date(),
    });

  it('rejects malformed JWT', async () => {
    const { handler, tokens } = make();
    tokens.verifyRefreshToken.mockImplementation(() => {
      throw new Error('bad jwt');
    });
    await expect(
      handler.execute(new RefreshTokensCommand('garbage')),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rejects unknown jti', async () => {
    const { handler, refreshTokens, tokens } = make();
    tokens.verifyRefreshToken.mockReturnValue({ sub: 'u1', jti: 'rt-1' });
    refreshTokens.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new RefreshTokensCommand('jwt')),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rejects when stored hash mismatches (DB-leak protection)', async () => {
    const { handler, refreshTokens, tokens } = make();
    tokens.verifyRefreshToken.mockReturnValue({ sub: 'u1', jti: 'rt-1' });
    tokens.hashRefreshToken.mockReturnValue('different-hash');
    refreshTokens.findById.mockResolvedValue(validStored());
    await expect(
      handler.execute(new RefreshTokensCommand('jwt')),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('detects reuse: revoked token presented again revokes all sessions', async () => {
    const { handler, refreshTokens, tokens } = make();
    tokens.verifyRefreshToken.mockReturnValue({ sub: 'u1', jti: 'rt-1' });
    tokens.hashRefreshToken.mockReturnValue('stored-hash');
    refreshTokens.findById.mockResolvedValue(validStored({ revokedAt: new Date() }));

    await expect(
      handler.execute(new RefreshTokensCommand('jwt')),
    ).rejects.toBeInstanceOf(RefreshTokenReusedError);
    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u1');
  });

  it('rejects expired stored token', async () => {
    const { handler, refreshTokens, tokens } = make();
    tokens.verifyRefreshToken.mockReturnValue({ sub: 'u1', jti: 'rt-1' });
    tokens.hashRefreshToken.mockReturnValue('stored-hash');
    refreshTokens.findById.mockResolvedValue(
      RefreshToken.rehydrate({
        id: 'rt-1',
        userId: 'u1',
        tokenHash: 'stored-hash',
        userAgent: null,
        ip: null,
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
        replacedBy: null,
        createdAt: new Date(),
      }),
    );
    await expect(
      handler.execute(new RefreshTokensCommand('jwt')),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rejects when user is blocked', async () => {
    const { handler, users, refreshTokens, tokens } = make();
    tokens.verifyRefreshToken.mockReturnValue({ sub: 'u1', jti: 'rt-1' });
    tokens.hashRefreshToken.mockReturnValue('stored-hash');
    refreshTokens.findById.mockResolvedValue(validStored());
    const user = User.register({
      id: 'u1',
      email: 'a@x.com',
      nickname: 'a',
      passwordHash: 'h',
    });
    user.block();
    users.findById.mockResolvedValue(user);

    await expect(
      handler.execute(new RefreshTokensCommand('jwt')),
    ).rejects.toBeInstanceOf(AccountBlockedError);
  });

  it('rotates tokens on success: issues new pair, revokes old', async () => {
    const { handler, users, refreshTokens, tokens } = make();
    tokens.verifyRefreshToken.mockReturnValue({ sub: 'u1', jti: 'rt-1' });
    tokens.hashRefreshToken.mockReturnValue('stored-hash');
    const stored = validStored();
    refreshTokens.findById.mockResolvedValue(stored);
    users.findById.mockResolvedValue(
      User.register({ id: 'u1', email: 'a@x.com', nickname: 'a', passwordHash: 'h' }),
    );

    const result = await handler.execute(new RefreshTokensCommand('jwt'));

    expect(result.accessToken).toBe('new.access');
    expect(result.refreshToken).toBe('new.refresh.jwt');

    // Two saves: first inserts the new token, second saves the revoked old token
    expect(refreshTokens.save).toHaveBeenCalledTimes(2);
    expect(stored.isRevoked).toBe(true);
  });
});
