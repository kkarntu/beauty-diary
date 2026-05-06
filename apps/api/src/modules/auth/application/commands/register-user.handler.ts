import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { v7 as uuidv7 } from 'uuid';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import { User } from '../../../users/domain/user.entity';
import { EmailAlreadyTakenError, NicknameAlreadyTakenError } from '../../domain/auth.errors';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/ports/password-hasher';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/ports/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../../domain/ports/token-service';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { RegisterUserCommand, type RegisterUserResult } from './register-user.command';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<
  RegisterUserCommand,
  RegisterUserResult
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(cmd: RegisterUserCommand): Promise<RegisterUserResult> {
    const email = cmd.email.toLowerCase().trim();

    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyTakenError();
    }
    if (await this.users.findByNickname(cmd.nickname)) {
      throw new NicknameAlreadyTakenError();
    }

    const passwordHash = await this.hasher.hash(cmd.password);
    const user = User.register({
      id: uuidv7(),
      email,
      nickname: cmd.nickname,
      passwordHash,
    });
    await this.users.save(user);

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
