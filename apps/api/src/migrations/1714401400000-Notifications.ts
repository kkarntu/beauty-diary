import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * In-app notifications. The application code creates these in the same
 * event handlers that enqueue emails — one row per recipient + event,
 * keyed on `user_id` for fast unread-count queries.
 *
 * `payload` is denormalised JSON (actor nickname, post slug, etc.) so
 * the bell-icon dropdown can render without joining 3 more tables for
 * every row.
 */
export class Notifications1714401400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"          uuid PRIMARY KEY,
        "user_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type"        text NOT NULL,
        "payload"     jsonb NOT NULL DEFAULT '{}'::jsonb,
        "read_at"     timestamptz,
        "created_at"  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_unread"
         ON "notifications" ("user_id", "created_at" DESC)
         WHERE "read_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user_created"
         ON "notifications" ("user_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
