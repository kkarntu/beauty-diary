import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Reactions1714400400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── post_likes ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "post_likes" (
        "user_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "post_id"     uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "post_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_post_likes_post_id" ON "post_likes" ("post_id")`);

    // ─── post_favorites ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "post_favorites" (
        "user_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "post_id"     uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("user_id", "post_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_post_favorites_user_created" ON "post_favorites" ("user_id", "created_at" DESC)`,
    );

    // ─── trigger to keep posts.likes_count in sync ─────────
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_post_likes_count()
      RETURNS trigger AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER post_likes_count_sync
      AFTER INSERT OR DELETE ON post_likes
      FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS post_likes_count_sync ON post_likes`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_post_likes_count()`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_favorites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_likes"`);
  }
}
