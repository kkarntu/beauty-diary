import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/ports/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../../domain/ports/token-service';
import { LogoutUserCommand } from './logout-user.command';

@CommandHandler(LogoutUserCommand)
export class LogoutUserHandler implements ICommandHandler<LogoutUserCommand, void> {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(cmd: LogoutUserCommand): Promise<void> {
    if (!cmd.rawRefreshToken) return;

    let jti: string;
    try {
      jti = this.tokens.verifyRefreshToken(cmd.rawRefreshToken).jti;
    } catch {
      // Malformed/expired token on logout — no-op. The cookie will still be cleared.
      return;
    }

    const stored = await this.refreshTokens.findById(jti);
    if (!stored || stored.isRevoked) return;

    stored.revoke();
    await this.refreshTokens.save(stored);
  }
}
