import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PendingRegistrations1714401500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pending_registrations" (
        "id"             uuid PRIMARY KEY,
        "email"          citext NOT NULL,
        "nickname"       citext NOT NULL,
        "password_hash"  text NOT NULL,
        "otp_hash"       text NOT NULL,
        "expires_at"     timestamptz NOT NULL,
        "attempts"       int NOT NULL DEFAULT 0,
        "last_resent_at" timestamptz,
        "created_at"     timestamptz NOT NULL DEFAULT now()
      )
    `);
    // One pending registration per email at a time — initiating again replaces it.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_pending_registrations_email" ON "pending_registrations" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_pending_registrations_expires_at" ON "pending_registrations" ("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pending_registrations"`);
  }
}
