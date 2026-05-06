import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-user toggles for the email handlers. Defaults match the values
 * the frontend was already showing in `/me/notifications` localStorage,
 * so existing accounts experience no behavioural change after the
 * migration runs.
 */
export class NotificationPreferences1714401200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "user_id"        uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
        "new_follower"   boolean NOT NULL DEFAULT true,
        "new_comment"    boolean NOT NULL DEFAULT true,
        "new_like"       boolean NOT NULL DEFAULT false,
        "newsletter"     boolean NOT NULL DEFAULT false,
        "updated_at"     timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);
  }
}
