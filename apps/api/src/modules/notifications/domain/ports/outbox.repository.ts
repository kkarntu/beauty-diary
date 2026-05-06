export interface OutboxEmailRow {
  id: string;
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  attempts: number;
}

export interface FailedOutboxRow {
  id: string;
  toEmail: string;
  subject: string;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
}

export interface EnqueueEmailInput {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailOutboxRepository {
  enqueue(input: EnqueueEmailInput): Promise<void>;
  /**
   * Returns at most `limit` pending rows that are due (next_attempt_at <= now),
   * oldest-due first. Caller decides per-row whether to retry or fail.
   */
  pickDuePending(limit: number): Promise<OutboxEmailRow[]>;
  markSent(id: string): Promise<void>;
  /**
   * Defers the row for another attempt at `nextAttemptAt`, persisting the
   * incremented `attempts` count and the truncated error message.
   */
  scheduleRetry(id: string, error: string, nextAttemptAt: Date): Promise<void>;
  /**
   * Marks the row as permanently failed — no further retries. Captures
   * the final error.
   */
  markFailed(id: string, error: string): Promise<void>;

  /** Lists rows in `status='failed'`, newest first. Used by the admin UI. */
  listFailed(limit: number, offset: number): Promise<{ items: FailedOutboxRow[]; total: number }>;

  /**
   * Resurrects a `failed` row: status='pending', attempts=0, last_error=null,
   * next_attempt_at=now. Returns false if the row wasn't found or wasn't failed.
   */
  requeue(id: string): Promise<boolean>;
}

export const EMAIL_OUTBOX_REPOSITORY = Symbol('EMAIL_OUTBOX_REPOSITORY');
