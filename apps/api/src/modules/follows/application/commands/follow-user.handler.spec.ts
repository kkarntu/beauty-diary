import type { EventBus } from '@nestjs/cqrs';
import type { UserRepository } from '../../../users/domain/ports/user.repository';
import { User } from '../../../users/domain/user.entity';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { CannotFollowSelfError } from '../../domain/follow.errors';
import type { FollowRepository } from '../../domain/ports/follow.repository';
import { UserFollowedEvent } from '../events/user-followed.event';
import { FollowUserCommand, UnfollowUserCommand } from './follow-user.command';
import { FollowUserHandler, UnfollowUserHandler } from './follow-user.handler';

function makeUser(id: string, nickname: string) {
  return User.rehydrate({
    id,
    email: `${nickname}@example.com`,
    nickname,
    passwordHash: 'x',
    role: 'user',
    displayName: null,
    avatarUrl: null,
    bio: null,
    isBlocked: false,
    followersCount: 0,
    followingCount: 0,
    emailVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('FollowUserHandler', () => {
  function setup({ insertedNew = true } = {}) {
    const followee = makeUser('00000000-0000-7000-8000-0000000000aa', 'alice');
    const users: Pick<UserRepository, 'findByNickname'> = {
      findByNickname: jest
        .fn()
        .mockImplementation((nick: string) => Promise.resolve(nick === 'alice' ? followee : null)),
    };
    const follows: FollowRepository = {
      follow: jest.fn().mockResolvedValue(insertedNew),
      unfollow: jest.fn().mockResolvedValue(true),
      isFollowing: jest.fn().mockResolvedValue(false),
    };
    const eventBus = { publish: jest.fn() } as unknown as EventBus;
    const handler = new FollowUserHandler(users as UserRepository, follows, eventBus);
    return { handler, users, follows, eventBus, followee };
  }

  it('persists a follow edge and publishes UserFollowedEvent on a new insert', async () => {
    const { handler, follows, eventBus, followee } = setup();
    const followerId = '00000000-0000-7000-8000-0000000000bb';
    await handler.execute(new FollowUserCommand(followerId, 'alice'));
    expect(follows.follow).toHaveBeenCalledWith(followerId, followee.id);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const evt = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(evt).toBeInstanceOf(UserFollowedEvent);
    expect(evt.followerId).toBe(followerId);
    expect(evt.followeeId).toBe(followee.id);
  });

  it('does not publish the event for duplicate follow attempts', async () => {
    const { handler, eventBus } = setup({ insertedNew: false });
    await handler.execute(new FollowUserCommand('00000000-0000-7000-8000-0000000000bb', 'alice'));
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('rejects self-follow', async () => {
    const { handler, follows, followee } = setup();
    await expect(
      handler.execute(new FollowUserCommand(followee.id, 'alice')),
    ).rejects.toBeInstanceOf(CannotFollowSelfError);
    expect(follows.follow).not.toHaveBeenCalled();
  });

  it('throws when the target user does not exist', async () => {
    const { handler } = setup();
    await expect(handler.execute(new FollowUserCommand('any', 'ghost'))).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });
});

describe('UnfollowUserHandler', () => {
  it('removes the follow edge', async () => {
    const followee = makeUser('00000000-0000-7000-8000-0000000000aa', 'alice');
    const users: Pick<UserRepository, 'findByNickname'> = {
      findByNickname: jest.fn().mockResolvedValue(followee),
    };
    const follows: FollowRepository = {
      follow: jest.fn(),
      unfollow: jest.fn().mockResolvedValue(true),
      isFollowing: jest.fn(),
    };
    const handler = new UnfollowUserHandler(users as UserRepository, follows);
    const followerId = '00000000-0000-7000-8000-0000000000bb';
    await handler.execute(new UnfollowUserCommand(followerId, 'alice'));
    expect(follows.unfollow).toHaveBeenCalledWith(followerId, followee.id);
  });
});
