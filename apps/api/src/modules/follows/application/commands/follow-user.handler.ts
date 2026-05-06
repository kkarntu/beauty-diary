import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { CannotFollowSelfError } from '../../domain/follow.errors';
import {
  FOLLOW_REPOSITORY,
  type FollowRepository,
} from '../../domain/ports/follow.repository';
import { UserFollowedEvent } from '../events/user-followed.event';
import { FollowUserCommand, UnfollowUserCommand } from './follow-user.command';

@CommandHandler(FollowUserCommand)
export class FollowUserHandler implements ICommandHandler<FollowUserCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: FollowUserCommand): Promise<void> {
    const followee = await this.users.findByNickname(cmd.followeeNickname);
    if (!followee) throw new UserNotFoundError();
    if (followee.id === cmd.followerId) throw new CannotFollowSelfError();
    const inserted = await this.follows.follow(cmd.followerId, followee.id);
    // Only emit when a *new* edge was created — duplicate follow attempts
    // shouldn't re-trigger notifications.
    if (inserted) {
      this.eventBus.publish(new UserFollowedEvent(cmd.followerId, followee.id));
    }
  }
}

@CommandHandler(UnfollowUserCommand)
export class UnfollowUserHandler implements ICommandHandler<UnfollowUserCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(FOLLOW_REPOSITORY) private readonly follows: FollowRepository,
  ) {}

  async execute(cmd: UnfollowUserCommand): Promise<void> {
    const followee = await this.users.findByNickname(cmd.followeeNickname);
    if (!followee) throw new UserNotFoundError();
    await this.follows.unfollow(cmd.followerId, followee.id);
  }
}
