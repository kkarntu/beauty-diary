import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds two boolean flags that surface as toggles in the post editor:
 *   - allow_comments — false hides the comment thread + 403s POST /comments
 *   - show_in_feed   — false keeps the post out of /feed and tag listings
 *                      (still reachable via direct slug for sharing)
 */
export class PostFlags1714401300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts"
         ADD COLUMN "allow_comments" boolean NOT NULL DEFAULT true,
         ADD COLUMN "show_in_feed" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts"
         DROP COLUMN IF EXISTS "allow_comments",
         DROP COLUMN IF EXISTS "show_in_feed"`,
    );
  }
}
