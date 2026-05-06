import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `next_attempt_at` so the processor can defer rejected rows by an
 * exponential-backoff window instead of writing them off on the first
 * SMTP hiccup. The partial index includes the column so the picker still
 * scans only future-due pending rows.
 */
export class EmailOutboxRetry1714401100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_email_outbox_pending"`);
    await queryRunner.query(
      `ALTER TABLE "email_outbox" ADD COLUMN "next_attempt_at" timestamptz NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_email_outbox_due"
         ON "email_outbox" ("next_attempt_at")
         WHERE "status" = 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_email_outbox_due"`);
    await queryRunner.query(`ALTER TABLE "email_outbox" DROP COLUMN IF EXISTS "next_attempt_at"`);
    await queryRunner.query(
      `CREATE INDEX "idx_email_outbox_pending" ON "email_outbox" ("created_at") WHERE "status" = 'pending'`,
    );
  }
}
