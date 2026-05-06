import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import {
  AccountBlockedError,
  InvalidRefreshTokenError,
  RefreshTokenReusedError,
} from '../../domain/auth.errors';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/ports/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../../domain/ports/token-service';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { RefreshTokensCommand, type RefreshTokensResult } from './refresh-tokens.command';

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensHandler implements ICommandHandler<
  RefreshTokensCommand,
  RefreshTokensResult
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(cmd: RefreshTokensCommand): Promise<RefreshTokensResult> {
    let payload: { sub: string; jti: string };
    try {
      payload = this.tokens.verifyRefreshToken(cmd.rawRefreshToken);
    } catch {
      throw new InvalidRefreshTokenError();
    }

    const stored = await this.refreshTokens.findById(payload.jti);
    if (!stored) {
      throw new InvalidRefreshTokenError();
    }

    const incomingHash = this.tokens.hashRefreshToken(cmd.rawRefreshToken);
    if (stored.tokenHash !== incomingHash) {
      throw new InvalidRefreshTokenError();
    }

    // Reuse detection: a revoked token presented again means it was leaked.
    // Revoke the entire session family (all of this user's tokens).
    if (stored.isRevoked) {
      await this.refreshTokens.revokeAllForUser(stored.userId);
      throw new RefreshTokenReusedError();
    }

    if (stored.isExpired) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.users.findById(stored.userId);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }
    if (user.isBlocked) {
      throw new AccountBlockedError();
    }

    // Issue a new pair, then revoke the old token pointing to the new one.
    const issuedRefresh = this.tokens.issueRefreshToken(user.id);
    const newRefresh = RefreshToken.issue({
      id: issuedRefresh.id,
      userId: user.id,
      tokenHash: issuedRefresh.tokenHash,
      expiresAt: issuedRefresh.expiresAt,
    });
    await this.refreshTokens.save(newRefresh);

    stored.revoke(newRefresh.id);
    await this.refreshTokens.save(stored);

    const accessToken = this.tokens.issueAccessToken({ sub: user.id, role: user.role });

    return {
      userId: user.id,
      accessToken,
      refreshToken: issuedRefresh.rawJwt,
      refreshTokenExpiresAt: issuedRefresh.expiresAt,
    };
  }
}
