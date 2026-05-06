import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames `posts.content_md` → `content_html` to match the WYSIWYG
 * (Tiptap) output format the frontend now uses.
 */
export class RenameContentMdToContentHtml1714400500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" RENAME COLUMN "content_md" TO "content_html"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" RENAME COLUMN "content_html" TO "content_md"`);
  }
}
