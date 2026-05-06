import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PostsAndComments1714400300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── posts ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id"               uuid PRIMARY KEY,
        "author_id"        uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category_id"      uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "slug"             citext NOT NULL,
        "title"            text NOT NULL,
        "excerpt"          text,
        "content_md"       text NOT NULL,
        "cover_image_url"  text,
        "status"           text NOT NULL DEFAULT 'draft',
        "published_at"     timestamptz,
        "reading_minutes"  int NOT NULL DEFAULT 1,
        "views_count"      int NOT NULL DEFAULT 0,
        "likes_count"      int NOT NULL DEFAULT 0,
        "comments_count"   int NOT NULL DEFAULT 0,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        "updated_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "ck_posts_status" CHECK (status IN ('draft', 'published', 'archived'))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_posts_slug" ON "posts" ("slug")`);
    await queryRunner.query(
      `CREATE INDEX "idx_posts_author_created_at" ON "posts" ("author_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_posts_category_published_at" ON "posts" ("category_id", "published_at" DESC) WHERE status = 'published'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_posts_published_at" ON "posts" ("published_at" DESC) WHERE status = 'published'`,
    );

    // ─── tags ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id"    uuid PRIMARY KEY,
        "slug"  citext NOT NULL,
        "name"  text NOT NULL
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_tags_slug" ON "tags" ("slug")`);

    // ─── post_tags (junction) ──────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "post_tags" (
        "post_id"  uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
        "tag_id"   uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        PRIMARY KEY ("post_id", "tag_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_post_tags_tag_post" ON "post_tags" ("tag_id", "post_id")`,
    );

    // ─── comments ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id"          uuid PRIMARY KEY,
        "post_id"     uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
        "author_id"   uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "parent_id"   uuid REFERENCES "comments"("id") ON DELETE CASCADE,
        "content"     text NOT NULL,
        "edited_at"   timestamptz,
        "deleted_at"  timestamptz,
        "created_at"  timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_comments_post_created_at" ON "comments" ("post_id", "created_at" ASC)`,
    );
    await queryRunner.query(`CREATE INDEX "idx_comments_author_id" ON "comments" ("author_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
  }
}
