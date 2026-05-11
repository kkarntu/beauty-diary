import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { v7 as uuidv7 } from 'uuid';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import { User } from '../../../users/domain/user.entity';
import {
  EmailAlreadyTakenError,
  InvalidOtpError,
  NicknameAlreadyTakenError,
  PendingRegistrationNotFoundError,
} from '../../domain/auth.errors';
import {
  PENDING_REGISTRATION_REPOSITORY,
  type PendingRegistrationRepository,
} from '../../domain/ports/pending-registration.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../domain/ports/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../../domain/ports/token-service';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { hashOtp } from './initiate-register.handler';
import { VerifyRegisterCommand, type VerifyRegisterResult } from './verify-register.command';

const MAX_OTP_ATTEMPTS = 5;

@CommandHandler(VerifyRegisterCommand)
export class VerifyRegisterHandler implements ICommandHandler<
  VerifyRegisterCommand,
  VerifyRegisterResult
> {
  constructor(
    @Inject(PENDING_REGISTRATION_REPOSITORY)
    private readonly pending: PendingRegistrationRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(cmd: VerifyRegisterCommand): Promise<VerifyRegisterResult> {
    const email = cmd.email.toLowerCase().trim();
    const record = await this.pending.findByEmail(email);
    if (!record) throw new PendingRegistrationNotFoundError();

    const isExpired = record.expiresAt.getTime() <= Date.now();
    const tooManyAttempts = record.attempts >= MAX_OTP_ATTEMPTS;
    if (isExpired || tooManyAttempts) {
      // Drop the dead record so the user can /initiate again cleanly.
      await this.pending.deleteByEmail(email);
      throw new InvalidOtpError();
    }

    if (hashOtp(cmd.otp) !== record.otpHash) {
      await this.pending.incrementAttempts(email);
      throw new InvalidOtpError();
    }

    // Race-window guard: someone else may have grabbed the email/nick
    // between /initiate and /verify.
    if (await this.users.findByEmail(email)) {
      await this.pending.deleteByEmail(email);
      throw new EmailAlreadyTakenError();
    }
    if (await this.users.findByNickname(record.nickname)) {
      await this.pending.deleteByEmail(email);
      throw new NicknameAlreadyTakenError();
    }

    const user = User.register({
      id: uuidv7(),
      email,
      nickname: record.nickname,
      passwordHash: record.passwordHash,
    });
    user.verifyEmail();
    await this.users.save(user);
    await this.pending.deleteByEmail(email);

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
