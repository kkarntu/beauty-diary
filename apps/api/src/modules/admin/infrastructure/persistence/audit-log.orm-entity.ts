import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
@Index('idx_audit_logs_created_at', ['createdAt'])
@Index('idx_audit_logs_target', ['targetType', 'targetId'])
@Index('idx_audit_logs_actor', ['actorId', 'createdAt'])
export class AuditLogOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'actor_id', type: 'uuid' })
  actorId!: string;

  @Column({ type: 'text' })
  action!: string;

  @Column({ name: 'target_type', type: 'text' })
  targetType!: string;

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId!: string | null;

  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
