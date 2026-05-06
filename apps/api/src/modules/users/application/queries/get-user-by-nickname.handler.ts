import { Inject, Optional } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  FOLLOW_REPOSITORY,
  type FollowRepository,
} from '../../../follows/domain/ports/follow.repository';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { UserNotFoundError } from '../../domain/user.errors';
import {
  GetUserByNicknameQuery,
  type GetUserByNicknameResult,
} from './get-user-by-nickname.query';

@QueryHandler(GetUserByNicknameQuery)
export class GetUserByNicknameHandler
  implements IQueryHandler<GetUserByNicknameQuery, GetUserByNicknameResult>
{
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Optional() @Inject(FOLLOW_REPOSITORY) private readonly follows?: FollowRepository,
  ) {}

  async execute(query: GetUserByNicknameQuery): Promise<GetUserByNicknameResult> {
    const user = await this.users.findByNickname(query.nickname);
    if (!user) {
      throw new UserNotFoundError();
    }
    const s = user.toSnapshot();
    const isFollowedByMe =
      this.follows && query.currentUserId && query.currentUserId !== s.id
        ? await this.follows.isFollowing(query.currentUserId, s.id)
        : false;
    return {
      id: s.id,
      nickname: s.nickname,
      displayName: s.displayName,
      avatarUrl: s.avatarUrl,
      bio: s.bio,
      followersCount: s.followersCount,
      followingCount: s.followingCount,
      isFollowedByMe,
    };
  }
}
