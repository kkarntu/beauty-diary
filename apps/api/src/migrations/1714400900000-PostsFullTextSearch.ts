import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stores a generated `search_tsv` tsvector on every post row, indexed
 * with GIN. Title is weighted highest, excerpt next, body last — gives
 * `ts_rank` something meaningful to sort by when the user runs a query.
 *
 * The expression strips HTML tags from `content_html` before tokenising
 * so words don't bleed together with markup. We use the `simple`
 * dictionary because the platform is bilingual (UK + EN) and we don't
 * want to misclassify Cyrillic words against an English stemmer.
 */
export class PostsFullTextSearch1714400900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "posts"
        ADD COLUMN "search_tsv" tsvector
        GENERATED ALWAYS AS (
          setweight(to_tsvector('simple', coalesce("title", '')), 'A')
          || setweight(to_tsvector('simple', coalesce("excerpt", '')), 'B')
          || setweight(
               to_tsvector(
                 'simple',
                 regexp_replace(coalesce("content_html", ''), '<[^>]+>', ' ', 'g')
               ),
               'C'
             )
        ) STORED
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_posts_search_tsv" ON "posts" USING GIN ("search_tsv")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_posts_search_tsv"`);
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "search_tsv"`);
  }
}
