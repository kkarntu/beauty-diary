import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLogs1714400600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"           uuid PRIMARY KEY,
        "actor_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE SET NULL,
        "action"       text NOT NULL,
        "target_type"  text NOT NULL,
        "target_id"    uuid,
        "metadata"     jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at"   timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_target" ON "audit_logs" ("target_type", "target_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_actor" ON "audit_logs" ("actor_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
