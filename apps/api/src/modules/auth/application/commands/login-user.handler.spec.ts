import { User } from '../../../users/domain/user.entity';
import type { UserRepository } from '../../../users/domain/ports/user.repository';
import {
  AccountBlockedError,
  InvalidCredentialsError,
} from '../../domain/auth.errors';
import type { PasswordHasher } from '../../domain/ports/password-hasher';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository';
import type { TokenService } from '../../domain/ports/token-service';
import { LoginUserCommand } from './login-user.command';
import { LoginUserHandler } from './login-user.handler';

describe('LoginUserHandler', () => {
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
      hash: jest.fn(),
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
      handler: new LoginUserHandler(users, refreshTokens, hasher, tokens),
    };
  };

  it('rejects when user is unknown', async () => {
    const { handler, users } = makeHandler();
    users.findByEmail.mockResolvedValueOnce(null);

    await expect(
      handler.execute(new LoginUserCommand('nope@x.com', 'password1')),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects when password mismatches', async () => {
    const { handler, users, hasher } = makeHandler();
    users.findByEmail.mockResolvedValueOnce(
      User.register({ id: 'u1', email: 'a@x.com', nickname: 'a', passwordHash: 'stored' }),
    );
    hasher.verify.mockResolvedValueOnce(false);

    await expect(
      handler.execute(new LoginUserCommand('a@x.com', 'wrong')),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects when account is blocked', async () => {
    const { handler, users } = makeHandler();
    const user = User.register({
      id: 'u1',
      email: 'a@x.com',
      nickname: 'a',
      passwordHash: 'h',
    });
    user.block();
    users.findByEmail.mockResolvedValueOnce(user);

    await expect(
      handler.execute(new LoginUserCommand('a@x.com', 'whatever')),
    ).rejects.toBeInstanceOf(AccountBlockedError);
  });

  it('issues tokens on successful login', async () => {
    const { handler, users, hasher, refreshTokens } = makeHandler();
    users.findByEmail.mockResolvedValueOnce(
      User.register({ id: 'u1', email: 'a@x.com', nickname: 'a', passwordHash: 'h' }),
    );
    hasher.verify.mockResolvedValueOnce(true);

    const result = await handler.execute(new LoginUserCommand('A@x.com', 'password1'));

    expect(refreshTokens.save).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access.jwt');
    expect(result.refreshToken).toBe('refresh.jwt');
  });
});
