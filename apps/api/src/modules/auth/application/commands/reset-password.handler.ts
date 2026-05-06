import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { createHash } from 'node:crypto';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import { InvalidPasswordResetTokenError } from '../../domain/auth.errors';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/ports/password-hasher';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepository,
} from '../../domain/ports/password-reset-token.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/ports/refresh-token.repository';
import { ResetPasswordCommand } from './reset-password.command';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: PasswordResetTokenRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(cmd: ResetPasswordCommand): Promise<void> {
    const tokenHash = createHash('sha256').update(cmd.rawToken).digest('hex');
    const token = await this.resetTokens.findByTokenHash(tokenHash);
    if (!token || !token.isUsable) {
      throw new InvalidPasswordResetTokenError();
    }

    const user = await this.users.findById(token.userId);
    if (!user) {
      throw new InvalidPasswordResetTokenError();
    }

    const newHash = await this.hasher.hash(cmd.newPassword);
    user.changePassword(newHash);
    await this.users.save(user);

    token.markUsed();
    await this.resetTokens.save(token);

    // Sign all sessions out — password change must invalidate existing tokens.
    await this.refreshTokens.revokeAllForUser(user.id);
  }
}
