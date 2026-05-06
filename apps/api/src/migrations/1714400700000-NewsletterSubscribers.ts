import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NewsletterSubscribers1714400700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "newsletter_subscribers" (
        "id"           uuid PRIMARY KEY,
        "email"        text NOT NULL UNIQUE,
        "created_at"   timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_newsletter_subscribers_created_at" ON "newsletter_subscribers" ("created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers"`);
  }
}
