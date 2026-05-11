import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomBytes, createHash } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { EnvService } from '../../../../config/env.service';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import {
  EMAIL_OUTBOX_REPOSITORY,
  type EmailOutboxRepository,
} from '../../../notifications/domain/ports/outbox.repository';
import {
  PASSWORD_RESET_TOKEN_REPOSITORY,
  type PasswordResetTokenRepository,
} from '../../domain/ports/password-reset-token.repository';
import {
  renderActionEmail,
  renderActionEmailText,
} from '../../../notifications/infrastructure/email-templates';
import { PasswordResetToken } from '../../domain/password-reset-token.entity';
import { RequestPasswordResetCommand } from './request-password-reset.command';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler implements ICommandHandler<
  RequestPasswordResetCommand,
  void
> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY)
    private readonly resetTokens: PasswordResetTokenRepository,
    @Inject(EMAIL_OUTBOX_REPOSITORY) private readonly outbox: EmailOutboxRepository,
    private readonly env: EnvService,
  ) {}

  /**
   * Always returns void without disclosing whether the email exists, to
   * avoid account enumeration. Email delivery is queued via the outbox so
   * the request returns instantly even when SMTP is slow or down.
   */
  async execute(cmd: RequestPasswordResetCommand): Promise<void> {
    const email = cmd.email.toLowerCase().trim();
    const user = await this.users.findByEmail(email);
    if (!user) return;

    // Invalidate previous tokens for this user — only the latest is usable.
    await this.resetTokens.invalidateAllForUser(user.id);

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const token = PasswordResetToken.issue({
      id: uuidv7(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });
    await this.resetTokens.save(token);

    const url = `${this.env.webOrigin.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
    const heading = 'Reset your password';
    const intro =
      'We received a request to reset the password for your Beauty Diary account. Tap the button below to choose a new one. The link is valid for 1 hour.';
    const ctaLabel = 'Reset password';
    const fallbackNote = 'Button not working? Copy and paste this link into your browser:';
    const footerNote =
      "If you didn't request a password reset, you can safely ignore this email — your password won't change.";

    await this.outbox.enqueue({
      toEmail: user.email,
      subject: 'Reset your Beauty Diary password',
      text: renderActionEmailText({ heading, intro, ctaLabel, ctaUrl: url, footerNote }),
      html: renderActionEmail({
        preheader: 'Reset your Beauty Diary password — link expires in 1 hour.',
        heading,
        intro,
        ctaLabel,
        ctaUrl: url,
        fallbackNote,
        footerNote,
      }),
    });
  }
}
