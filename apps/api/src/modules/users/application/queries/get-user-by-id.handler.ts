import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY, type UserRepository } from '../../domain/ports/user.repository';
import { UserNotFoundError } from '../../domain/user.errors';
import { GetUserByIdQuery, type GetUserByIdResult } from './get-user-by-id.query';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, GetUserByIdResult> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<GetUserByIdResult> {
    const user = await this.users.findById(query.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    const s = user.toSnapshot();
    return {
      id: s.id,
      nickname: s.nickname,
      displayName: s.displayName,
      avatarUrl: s.avatarUrl,
      bio: s.bio,
      followersCount: s.followersCount,
      followingCount: s.followingCount,
      // Self-follow is impossible — always false for self-lookups.
      isFollowedByMe: false,
    };
  }
}
