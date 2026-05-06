import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'email_outbox' })
export class EmailOutboxOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'to_email', type: 'text' })
  toEmail!: string;

  @Column({ type: 'text' })
  subject!: string;

  @Column({ type: 'text' })
  html!: string;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'text', default: 'pending' })
  status!: 'pending' | 'sent' | 'failed';

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'next_attempt_at', type: 'timestamptz', default: () => 'now()' })
  nextAttemptAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
