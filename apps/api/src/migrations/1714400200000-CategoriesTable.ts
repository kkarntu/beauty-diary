import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoriesTable1714400200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"               uuid PRIMARY KEY,
        "slug"             citext NOT NULL,
        "name"             text NOT NULL,
        "description"      text,
        "cover_image_url"  text,
        "sort_order"       int NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_categories_slug" ON "categories" ("slug")`);

    // Seed the canonical taxonomy. The six categories are part of the
    // product spec, not editable by clients — this lives in a migration so
    // every environment (local, CI, prod) gets the same UUIDs and slugs.
    const seed = [
      ['skincare', 'Догляд за шкірою', 'Усе про скінкер: рутини, інгредієнти, відгуки на засоби.', 10],
      ['makeup', 'Макіяж', 'Техніки, тренди, тестування продуктів.', 20],
      ['fashion', 'Мода', 'Стиль, гардероб, сезонні тренди.', 30],
      ['wellness', 'Wellness', 'Психічне здоровʼя, спорт, харчування.', 40],
      ['hair', 'Волосся', 'Догляд, стрижки, фарбування.', 50],
      ['lifestyle', 'Lifestyle', 'Усе інше — щоденник, подорожі, культура.', 60],
    ];

    for (const [slug, name, description, sortOrder] of seed) {
      await queryRunner.query(
        `INSERT INTO "categories" ("id", "slug", "name", "description", "sort_order")
         VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
        [slug, name, description, sortOrder],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
