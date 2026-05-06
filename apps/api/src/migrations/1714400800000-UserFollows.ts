import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserFollows1714400800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add denormalized counts to users so feed cards / profiles can render
    // without an aggregate query each render.
    await queryRunner.query(
      `ALTER TABLE "users"
         ADD COLUMN "followers_count" int NOT NULL DEFAULT 0,
         ADD COLUMN "following_count" int NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(`
      CREATE TABLE "user_follows" (
        "follower_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "followee_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("follower_id", "followee_id"),
        CHECK ("follower_id" <> "followee_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_user_follows_followee" ON "user_follows" ("followee_id")`,
    );

    // Keep the counts in sync with the join table — single source of truth.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_user_follow_counts()
      RETURNS trigger AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.followee_id;
          UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE users SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.followee_id;
          UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER user_follows_count_sync
      AFTER INSERT OR DELETE ON user_follows
      FOR EACH ROW EXECUTE FUNCTION update_user_follow_counts();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS user_follows_count_sync ON user_follows`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_user_follow_counts()`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_follows"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "followers_count", DROP COLUMN IF EXISTS "following_count"`,
    );
  }
}
