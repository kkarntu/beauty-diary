import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Outbox pattern for transactional emails. Event handlers enqueue rows
 * synchronously inside the same transaction as the trigger event; a
 * background worker drains the queue and sends via SMTP.
 *
 * Status flow: pending → sent | failed. `attempts` + `last_error` give
 * us a quick read on what's stuck without diving into application logs.
 */
export class EmailOutbox1714401000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_outbox" (
        "id"          uuid PRIMARY KEY,
        "to_email"    text NOT NULL,
        "subject"     text NOT NULL,
        "html"        text NOT NULL,
        "text"        text NOT NULL,
        "status"      text NOT NULL DEFAULT 'pending',
        "attempts"    int  NOT NULL DEFAULT 0,
        "last_error"  text,
        "sent_at"     timestamptz,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CHECK ("status" IN ('pending', 'sent', 'failed'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_email_outbox_pending" ON "email_outbox" ("created_at") WHERE "status" = 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "email_outbox"`);
  }
}
