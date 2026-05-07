import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  EMAIL_OUTBOX_REPOSITORY,
  type EmailOutboxRepository,
} from '../../../notifications/domain/ports/outbox.repository';
import { renderOtpEmail } from '../../../notifications/infrastructure/email-templates';
import {
  OtpResendCooldownError,
  PendingRegistrationNotFoundError,
} from '../../domain/auth.errors';
import {
  PENDING_REGISTRATION_REPOSITORY,
  type PendingRegistrationRepository,
} from '../../domain/ports/pending-registration.repository';
import { generateOtp, hashOtp } from './initiate-register.handler';
import { ResendRegisterOtpCommand } from './resend-register-otp.command';

const RESEND_COOLDOWN_MS = 60_000;
const OTP_TTL_MS = 10 * 60 * 1000;

@CommandHandler(ResendRegisterOtpCommand)
export class ResendRegisterOtpHandler
  implements ICommandHandler<ResendRegisterOtpCommand, void>
{
  constructor(
    @Inject(PENDING_REGISTRATION_REPOSITORY)
    private readonly pending: PendingRegistrationRepository,
    @Inject(EMAIL_OUTBOX_REPOSITORY) private readonly outbox: EmailOutboxRepository,
  ) {}

  async execute(cmd: ResendRegisterOtpCommand): Promise<void> {
    const email = cmd.email.toLowerCase().trim();
    const record = await this.pending.findByEmail(email);
    if (!record) throw new PendingRegistrationNotFoundError();

    const lastSent = record.lastResentAt ?? record.createdAt;
    const elapsed = Date.now() - lastSent.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const secondsRemaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new OtpResendCooldownError(secondsRemaining);
    }

    const otp = generateOtp();
    const now = new Date();
    await this.pending.rotateOtp(email, hashOtp(otp), new Date(now.getTime() + OTP_TTL_MS), now);

    const heading = 'Verify your email';
    const intro =
      'Here is a fresh 6-digit code to finish creating your Beauty Diary account. The code is valid for 10 minutes.';
    const footerNote =
      "If you didn't request this code, you can safely ignore this email.";

    await this.outbox.enqueue({
      toEmail: email,
      subject: 'Your new Beauty Diary verification code',
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
