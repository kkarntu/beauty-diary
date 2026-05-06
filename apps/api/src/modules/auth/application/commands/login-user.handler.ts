import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../users/domain/ports/user.repository';
import {
  AccountBlockedError,
  InvalidCredentialsError,
} from '../../domain/auth.errors';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/ports/password-hasher';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/ports/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../../domain/ports/token-service';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { LoginUserCommand, type LoginUserResult } from './login-user.command';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand, LoginUserResult> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(cmd: LoginUserCommand): Promise<LoginUserResult> {
    const email = cmd.email.toLowerCase().trim();
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    if (user.isBlocked) {
      throw new AccountBlockedError();
    }
    const passwordOk = await this.hasher.verify(user.passwordHash, cmd.password);
    if (!passwordOk) {
      throw new InvalidCredentialsError();
    }

    const accessToken = this.tokens.issueAccessToken({ sub: user.id, role: user.role });
    const issuedRefresh = this.tokens.issueRefreshToken(user.id);
    const refreshEntity = RefreshToken.issue({
      id: issuedRefresh.id,
      userId: user.id,
      tokenHash: issuedRefresh.tokenHash,
      expiresAt: issuedRefresh.expiresAt,
    });
    await this.refreshTokens.save(refreshEntity);

    return {
      userId: user.id,
      accessToken,
      refreshToken: issuedRefresh.rawJwt,
      refreshTokenExpiresAt: issuedRefresh.expiresAt,
    };
  }
}
