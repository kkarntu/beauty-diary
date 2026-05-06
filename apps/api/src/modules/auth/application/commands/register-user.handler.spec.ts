import { User } from '../../../users/domain/user.entity';
import type { UserRepository } from '../../../users/domain/ports/user.repository';
import {
  EmailAlreadyTakenError,
  NicknameAlreadyTakenError,
} from '../../domain/auth.errors';
import type { PasswordHasher } from '../../domain/ports/password-hasher';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository';
import type { TokenService } from '../../domain/ports/token-service';
import { RegisterUserCommand } from './register-user.command';
import { RegisterUserHandler } from './register-user.handler';

describe('RegisterUserHandler', () => {
  const makeHandler = () => {
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
    const hasher: jest.Mocked<PasswordHasher> = {
      hash: jest.fn().mockResolvedValue('hashed'),
      verify: jest.fn(),
    };
    const tokens: jest.Mocked<TokenService> = {
      issueAccessToken: jest.fn().mockReturnValue('access.jwt'),
      verifyAccessToken: jest.fn(),
      issueRefreshToken: jest.fn().mockReturnValue({
        id: 'rt-id',
        rawJwt: 'refresh.jwt',
        tokenHash: 'rt-hash',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
      verifyRefreshToken: jest.fn(),
      hashRefreshToken: jest.fn(),
    };
    return {
      users,
      refreshTokens,
      hasher,
      tokens,
      handler: new RegisterUserHandler(users, refreshTokens, hasher, tokens),
    };
  };

  it('rejects when email is taken', async () => {
    const { handler, users } = makeHandler();
    users.findByEmail.mockResolvedValueOnce(
      User.register({ id: 'u1', email: 'taken@x.com', nickname: 'a', passwordHash: 'h' }),
    );

    await expect(
      handler.execute(new RegisterUserCommand('Taken@X.com', 'password1', 'newnick')),
    ).rejects.toBeInstanceOf(EmailAlreadyTakenError);
  });

  it('rejects when nickname is taken', async () => {
    const { handler, users } = makeHandler();
    users.findByEmail.mockResolvedValueOnce(null);
    users.findByNickname.mockResolvedValueOnce(
      User.register({ id: 'u1', email: 'other@x.com', nickname: 'taken', passwordHash: 'h' }),
    );

    await expect(
      handler.execute(new RegisterUserCommand('new@x.com', 'password1', 'taken')),
    ).rejects.toBeInstanceOf(NicknameAlreadyTakenError);
  });

  it('saves user and issues tokens on success', async () => {
    const { handler, users, refreshTokens, hasher, tokens } = makeHandler();
    users.findByEmail.mockResolvedValue(null);
    users.findByNickname.mockResolvedValue(null);

    const result = await handler.execute(
      new RegisterUserCommand('NEW@x.com', 'password1', 'newnick'),
    );

    expect(hasher.hash).toHaveBeenCalledWith('password1');
    expect(users.save).toHaveBeenCalledTimes(1);
    const savedUser = users.save.mock.calls[0]![0];
    expect(savedUser.email).toBe('new@x.com');
    expect(savedUser.nickname).toBe('newnick');

    expect(tokens.issueAccessToken).toHaveBeenCalled();
    expect(tokens.issueRefreshToken).toHaveBeenCalled();
    expect(refreshTokens.save).toHaveBeenCalledTimes(1);

    expect(result.accessToken).toBe('access.jwt');
    expect(result.refreshToken).toBe('refresh.jwt');
  });
});
