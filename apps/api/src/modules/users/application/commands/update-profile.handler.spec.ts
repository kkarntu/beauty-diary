import { User } from '../../domain/user.entity';
import { UserNotFoundError } from '../../domain/user.errors';
import type { UserRepository } from '../../domain/ports/user.repository';
import { UpdateProfileCommand } from './update-profile.command';
import { UpdateProfileHandler } from './update-profile.handler';

describe('UpdateProfileHandler', () => {
  const makeHandler = () => {
    const users: jest.Mocked<UserRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByNickname: jest.fn(),
      save: jest.fn(),
    };
    return { users, handler: new UpdateProfileHandler(users) };
  };

  it('throws when user does not exist', async () => {
    const { handler, users } = makeHandler();
    users.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new UpdateProfileCommand('missing', { bio: 'hi' })),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('applies provided fields and saves', async () => {
    const { handler, users } = makeHandler();
    const user = User.register({ id: 'u1', email: 'a@x.com', nickname: 'a', passwordHash: 'h' });
    users.findById.mockResolvedValue(user);

    await handler.execute(
      new UpdateProfileCommand('u1', { bio: 'updated bio', displayName: 'Anna' }),
    );

    expect(users.save).toHaveBeenCalledTimes(1);
    const saved = users.save.mock.calls[0]![0].toSnapshot();
    expect(saved.bio).toBe('updated bio');
    expect(saved.displayName).toBe('Anna');
    expect(saved.avatarUrl).toBeNull(); // unchanged from initial
  });

  it('allows clearing fields by passing null', async () => {
    const { handler, users } = makeHandler();
    const user = User.register({ id: 'u1', email: 'a@x.com', nickname: 'a', passwordHash: 'h' });
    user.updateProfile({ bio: 'old' });
    users.findById.mockResolvedValue(user);

    await handler.execute(new UpdateProfileCommand('u1', { bio: null }));

    const saved = users.save.mock.calls[0]![0].toSnapshot();
    expect(saved.bio).toBeNull();
  });
});
