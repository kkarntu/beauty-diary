import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthTables1714400100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                 uuid PRIMARY KEY,
        "email"              citext NOT NULL,
        "nickname"           citext NOT NULL,
        "password_hash"      text NOT NULL,
        "role"               text NOT NULL DEFAULT 'user',
        "display_name"       text,
        "avatar_url"         text,
        "bio"                text,
        "is_blocked"         boolean NOT NULL DEFAULT false,
        "email_verified_at"  timestamptz,
        "created_at"         timestamptz NOT NULL DEFAULT now(),
        "updated_at"         timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "ck_users_role" CHECK (role IN ('user', 'admin'))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_nickname" ON "users" ("nickname")`);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"           uuid PRIMARY KEY,
        "user_id"      uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash"   text NOT NULL,
        "user_agent"   text,
        "ip"           inet,
        "expires_at"   timestamptz NOT NULL,
        "revoked_at"   timestamptz,
        "replaced_by"  uuid,
        "created_at"   timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id"           uuid PRIMARY KEY,
        "user_id"      uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash"   text NOT NULL,
        "expires_at"   timestamptz NOT NULL,
        "used_at"      timestamptz,
        "created_at"   timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_password_reset_tokens_token_hash" ON "password_reset_tokens" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
