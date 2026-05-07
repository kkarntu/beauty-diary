import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'pending_registrations' })
@Index('uq_pending_registrations_email', ['email'], { unique: true })
export class PendingRegistrationOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'citext' })
  email!: string;

  @Column({ type: 'citext' })
  nickname!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'otp_hash', type: 'text' })
  otpHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'last_resent_at', type: 'timestamptz', nullable: true })
  lastResentAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
