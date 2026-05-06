import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { FollowRepository } from '../../domain/ports/follow.repository';
import { UserFollowOrmEntity } from './user-follow.orm-entity';

@Injectable()
export class TypeOrmFollowRepository implements FollowRepository {
  constructor(
    @InjectRepository(UserFollowOrmEntity)
    private readonly repo: Repository<UserFollowOrmEntity>,
  ) {}

  async follow(followerId: string, followeeId: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into(UserFollowOrmEntity)
      .values({ followerId, followeeId })
      .orIgnore()
      .execute();
    return (result.identifiers?.length ?? 0) > 0;
  }

  async unfollow(followerId: string, followeeId: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(UserFollowOrmEntity)
      .where('follower_id = :followerId AND followee_id = :followeeId', {
        followerId,
        followeeId,
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const found = await this.repo
      .createQueryBuilder()
      .select('1')
      .where('follower_id = :followerId AND followee_id = :followeeId', {
        followerId,
        followeeId,
      })
      .getRawOne();
    return !!found;
  }
}
