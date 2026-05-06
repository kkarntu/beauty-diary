import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user_follows' })
export class UserFollowOrmEntity {
  @PrimaryColumn({ name: 'follower_id', type: 'uuid' })
  followerId!: string;

  @PrimaryColumn({ name: 'followee_id', type: 'uuid' })
  followeeId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
