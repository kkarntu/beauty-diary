import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { GetCurrentUserQuery, type GetCurrentUserResult } from './get-current-user.query';

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<
  GetCurrentUserQuery,
  GetCurrentUserResult
> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(query: GetCurrentUserQuery): Promise<GetCurrentUserResult> {
    const user = await this.users.findById(query.userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    const s = user.toSnapshot();
    return {
      id: s.id,
      email: s.email,
      nickname: s.nickname,
      displayName: s.displayName,
      avatarUrl: s.avatarUrl,
      bio: s.bio,
      followersCount: s.followersCount,
      followingCount: s.followingCount,
      // Self-follow is impossible — always false in /auth/me.
      isFollowedByMe: false,
      role: s.role,
      emailVerifiedAt: s.emailVerifiedAt ? s.emailVerifiedAt.toISOString() : null,
    };
  }
}
