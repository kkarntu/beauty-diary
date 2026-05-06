import { createHash } from 'node:crypto';
import { User } from '../../../users/domain/user.entity';
import type { UserRepository } from '../../../users/domain/ports/user.repository';
import { InvalidPasswordResetTokenError } from '../../domain/auth.errors';
import { PasswordResetToken } from '../../domain/password-reset-token.entity';
import type { PasswordHasher } from '../../domain/ports/password-hasher';
import type { PasswordResetTokenRepository } from '../../domain/ports/password-reset-token.repository';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository';
import { ResetPasswordCommand } from './reset-password.command';
import { ResetPasswordHandler } from './reset-password.handler';

describe('ResetPasswordHandler', () => {
  const make = () => {
    const users: jest.Mocked<UserRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByNickname: jest.fn(),
      save: jest.fn(),
    };
    const resetTokens: jest.Mocked<PasswordResetTokenRepository> = {
      findByTokenHash: jest.fn(),
      save: jest.fn(),
      invalidateAllForUser: jest.fn(),
    };
    const refreshTokens: jest.Mocked<RefreshTokenRepository> = {
      findById: jest.fn(),
      save: jest.fn(),
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn(),
    };
    const hasher: jest.Mocked<PasswordHasher> = {
      hash: jest.fn().mockResolvedValue('new-hash'),
      verify: jest.fn(),
    };
    return {
      users,
      resetTokens,
      refreshTokens,
      hasher,
      handler: new ResetPasswordHandler(users, resetTokens, refreshTokens, hasher),
    };
  };

  const issue = (overrides: { used?: boolean; expired?: boolean } = {}) =>
    PasswordResetToken.rehydrate({
      id: 'prt-1',
      userId: 'u1',
      tokenHash: createHash('sha256').update('raw').digest('hex'),
      expiresAt: overrides.expired ? new Date(Date.now() - 1000) : new Date(Date.now() + 60_000),
      usedAt: overrides.used ? new Date() : null,
      createdAt: new Date(),
    });

  it('rejects unknown token', async () => {
    const { handler, resetTokens } = make();
    resetTokens.findByTokenHash.mockResolvedValue(null);
    await expect(
      handler.execute(new ResetPasswordCommand('raw', 'newPass!1')),
    ).rejects.toBeInstanceOf(InvalidPasswordResetTokenError);
  });

  it('rejects already-used token', async () => {
    const { handler, resetTokens } = make();
    resetTokens.findByTokenHash.mockResolvedValue(issue({ used: true }));
    await expect(
      handler.execute(new ResetPasswordCommand('raw', 'newPass!1')),
    ).rejects.toBeInstanceOf(InvalidPasswordResetTokenError);
  });

  it('rejects expired token', async () => {
    const { handler, resetTokens } = make();
    resetTokens.findByTokenHash.mockResolvedValue(issue({ expired: true }));
    await expect(
      handler.execute(new ResetPasswordCommand('raw', 'newPass!1')),
    ).rejects.toBeInstanceOf(InvalidPasswordResetTokenError);
  });

  it('rejects when user is gone', async () => {
    const { handler, resetTokens, users } = make();
    resetTokens.findByTokenHash.mockResolvedValue(issue());
    users.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new ResetPasswordCommand('raw', 'newPass!1')),
    ).rejects.toBeInstanceOf(InvalidPasswordResetTokenError);
  });

  it('hashes new password, marks token used, revokes all sessions', async () => {
    const { handler, resetTokens, refreshTokens, users, hasher } = make();
    resetTokens.findByTokenHash.mockResolvedValue(issue());
    const user = User.register({
      id: 'u1',
      email: 'a@x.com',
      nickname: 'a',
      passwordHash: 'old-hash',
    });
    users.findById.mockResolvedValue(user);

    await handler.execute(new ResetPasswordCommand('raw', 'newPass!1'));

    expect(hasher.hash).toHaveBeenCalledWith('newPass!1');
    expect(users.save).toHaveBeenCalled();
    expect(users.save.mock.calls[0]![0].passwordHash).toBe('new-hash');
    expect(resetTokens.save).toHaveBeenCalled();
    expect(resetTokens.save.mock.calls[0]![0].toSnapshot().usedAt).not.toBeNull();
    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('u1');
  });
});
