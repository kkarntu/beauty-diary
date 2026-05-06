import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnvService } from '../../../config/env.service';
import { MAILER, type Mailer } from '../../auth/domain/ports/mailer';
import {
  EMAIL_OUTBOX_REPOSITORY,
  type EmailOutboxRepository,
} from '../domain/ports/outbox.repository';

const BATCH = 25;
export const MAX_ATTEMPTS = 5;
/**
 * Backoff per attempt index (0-based). After attempt N fails, the row is
 * scheduled for `BACKOFF_MS[N]` later. After exhausting this list the row
 * is marked `failed` permanently.
 */
export const BACKOFF_MS = [
  60_000, // 1 minute
  5 * 60_000, // 5 minutes
  15 * 60_000, // 15 minutes
  60 * 60_000, // 1 hour
  6 * 60 * 60_000, // 6 hours
];

/**
 * Drains the `email_outbox` queue every 30s. Transient failures (SMTP blip,
 * DNS lookup error, etc.) are retried with exponential backoff up to
 * `MAX_ATTEMPTS`; after that the row is marked `failed` and stops cycling.
 *
 * The job is a no-op in `NODE_ENV=test` so integration tests run on a
 * clean clock.
 */
@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private busy = false;

  constructor(
    @Inject(EMAIL_OUTBOX_REPOSITORY) private readonly outbox: EmailOutboxRepository,
    @Inject(MAILER) private readonly mailer: Mailer,
    private readonly env: EnvService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async tick(): Promise<void> {
    if (this.env.isTest) return;
    if (this.busy) return;
    this.busy = true;
    try {
      const due = await this.outbox.pickDuePending(BATCH);
      for (const row of due) {
        try {
          await this.mailer.send({
            to: row.toEmail,
            subject: row.subject,
            text: row.text,
            html: row.html,
          });
          await this.outbox.markSent(row.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // `row.attempts` reflects prior failures — this iteration is the (n+1)th.
          const nextAttemptIndex = row.attempts;
          if (nextAttemptIndex + 1 >= MAX_ATTEMPTS) {
            this.logger.error(
              `outbox ${row.id} permanently failed after ${nextAttemptIndex + 1} attempts: ${msg}`,
            );
            await this.outbox.markFailed(row.id, msg);
          } else {
            const delay = BACKOFF_MS[nextAttemptIndex] ?? BACKOFF_MS[BACKOFF_MS.length - 1]!;
            const nextAt = new Date(Date.now() + delay);
            this.logger.warn(
              `outbox ${row.id} attempt ${nextAttemptIndex + 1} failed, retry in ${delay}ms: ${msg}`,
            );
            await this.outbox.scheduleRetry(row.id, msg, nextAt);
          }
        }
      }
    } finally {
      this.busy = false;
    }
  }
}
