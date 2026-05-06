import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'notification_preferences' })
export class NotificationPreferencesOrmEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'new_follower', type: 'boolean', default: true })
  newFollower!: boolean;

  @Column({ name: 'new_comment', type: 'boolean', default: true })
  newComment!: boolean;

  @Column({ name: 'new_like', type: 'boolean', default: false })
  newLike!: boolean;

  @Column({ name: 'newsletter', type: 'boolean', default: false })
  newsletter!: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
