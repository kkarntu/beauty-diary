import { User } from '../../../users/domain/user.entity';
import type { UserRepository } from '../../../users/domain/ports/user.repository';
import type { EmailOutboxRepository } from '../../../notifications/domain/ports/outbox.repository';
import type { PasswordResetTokenRepository } from '../../domain/ports/password-reset-token.repository';
import type { EnvService } from '../../../../config/env.service';
import { RequestPasswordResetCommand } from './request-password-reset.command';
import { RequestPasswordResetHandler } from './request-password-reset.handler';

describe('RequestPasswordResetHandler', () => {
  const make = () => {
    const users: jest.Mocked<UserRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByNickname: jest.fn(),
      save: jest.fn(),
    };
    const resetTokens: jest.Mocked<PasswordResetTokenRepository> = {
      findByTokenHash: jest.fn(),
      save: jest.fn(),
      invalidateAllForUser: jest.fn(),
    };
    const outbox: jest.Mocked<EmailOutboxRepository> = {
      enqueue: jest.fn().mockResolvedValue(undefined),
      pickDuePending: jest.fn(),
      markSent: jest.fn(),
      scheduleRetry: jest.fn(),
      markFailed: jest.fn(),
      listFailed: jest.fn(),
      requeue: jest.fn(),
    };
    const env = { webOrigin: 'https://example.com' } as EnvService;
    return {
      users,
      resetTokens,
      outbox,
      handler: new RequestPasswordResetHandler(users, resetTokens, outbox, env),
    };
  };

  it('returns silently when email is unknown (no enumeration)', async () => {
    const { handler, users, resetTokens, outbox } = make();
    users.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new RequestPasswordResetCommand('unknown@x.com')),
    ).resolves.toBeUndefined();

    expect(resetTokens.save).not.toHaveBeenCalled();
    expect(outbox.enqueue).not.toHaveBeenCalled();
  });

  it('issues a token and queues a reset email for known users', async () => {
    const { handler, users, resetTokens, outbox } = make();
    users.findByEmail.mockResolvedValue(
      User.register({ id: 'u1', email: 'a@x.com', nickname: 'a', passwordHash: 'h' }),
    );

    await handler.execute(new RequestPasswordResetCommand('a@x.com'));

    expect(resetTokens.invalidateAllForUser).toHaveBeenCalledWith('u1');
    expect(resetTokens.save).toHaveBeenCalled();
    expect(outbox.enqueue).toHaveBeenCalled();

    const mailArg = outbox.enqueue.mock.calls[0]![0];
    expect(mailArg.toEmail).toBe('a@x.com');
    expect(mailArg.subject).toMatch(/reset/i);
  });
});
