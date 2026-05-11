import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { createHash, randomInt } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import {
  EMAIL_OUTBOX_REPOSITORY,
  type EmailOutboxRepository,
} from '../../../notifications/domain/ports/outbox.repository';
import { renderOtpEmail } from '../../../notifications/infrastructure/email-templates';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import { EmailAlreadyTakenError, NicknameAlreadyTakenError } from '../../domain/auth.errors';
import { PASSWORD_HASHER, type PasswordHasher } from '../../domain/ports/password-hasher';
import {
  PENDING_REGISTRATION_REPOSITORY,
  type PendingRegistrationRepository,
} from '../../domain/ports/pending-registration.repository';
import { InitiateRegisterCommand } from './initiate-register.command';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

@CommandHandler(InitiateRegisterCommand)
export class InitiateRegisterHandler implements ICommandHandler<InitiateRegisterCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PENDING_REGISTRATION_REPOSITORY)
    private readonly pending: PendingRegistrationRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(EMAIL_OUTBOX_REPOSITORY) private readonly outbox: EmailOutboxRepository,
  ) {}

  async execute(cmd: InitiateRegisterCommand): Promise<void> {
    const email = cmd.email.toLowerCase().trim();
    if (await this.users.findByEmail(email)) throw new EmailAlreadyTakenError();
    if (await this.users.findByNickname(cmd.nickname)) throw new NicknameAlreadyTakenError();

    const otp = generateOtp();
    const passwordHash = await this.hasher.hash(cmd.password);

    await this.pending.upsert({
      id: uuidv7(),
      email,
      nickname: cmd.nickname,
      passwordHash,
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    const heading = 'Verify your email';
    const intro =
      'Enter this 6-digit code on the registration page to finish creating your Beauty Diary account. The code is valid for 10 minutes.';
    const footerNote =
      "If you didn't sign up, you can safely ignore this email — no account will be created.";

    await this.outbox.enqueue({
      toEmail: email,
      subject: 'Your Beauty Diary verification code',
      text: `${heading}\n\n${intro}\n\nCode: ${otp}\n\n${footerNote}`,
      html: renderOtpEmail({
        preheader: `Your Beauty Diary verification code is ${otp}`,
        heading,
        intro,
        otp,
        footerNote,
      }),
    });
  }
}
