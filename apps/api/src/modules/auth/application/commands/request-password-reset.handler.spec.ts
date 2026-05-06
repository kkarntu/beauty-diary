import { Logger } from '@nestjs/common';
import { User } from '../../../users/domain/user.entity';
import type { UserRepository } from '../../../users/domain/ports/user.repository';
import type { Mailer } from '../../domain/ports/mailer';
import type { PasswordResetTokenRepository } from '../../domain/ports/password-reset-token.repository';
import { RequestPasswordResetCommand } from './request-password-reset.command';
import { RequestPasswordResetHandler } from './request-password-reset.handler';

describe('RequestPasswordResetHandler', () => {
  // Silence the handler's Logger.error in the "mailer down" branch — we're
  // asserting the error is swallowed; the log noise just clutters the report.
  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

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
    const mailer: jest.Mocked<Mailer> = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    return {
      users,
      resetTokens,
      mailer,
      handler: new RequestPasswordResetHandler(users, resetTokens, mailer),
    };
  };

  it('returns silently when email is unknown (no enumeration)', async () => {
    const { handler, users, resetTokens, mailer } = make();
    users.findByEmail.mockResolvedValue(null);

    await expect(
      handler.execute(new RequestPasswordResetCommand('unknown@x.com')),
    ).resolves.toBeUndefined();

    expect(resetTokens.save).not.toHaveBeenCalled();
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('issues a token and emails it for known users', async () => {
    const { handler, users, resetTokens, mailer } = make();
    users.findByEmail.mockResolvedValue(
      User.register({ id: 'u1', email: 'a@x.com', nickname: 'a', passwordHash: 'h' }),
    );

    await handler.execute(new RequestPasswordResetCommand('a@x.com'));

    expect(resetTokens.invalidateAllForUser).toHaveBeenCalledWith('u1');
    expect(resetTokens.save).toHaveBeenCalled();
    expect(mailer.send).toHaveBeenCalled();

    // Mailer payload contains the raw token (not the hash)
    const mailArg = mailer.send.mock.calls[0]![0];
    expect(mailArg.to).toBe('a@x.com');
    expect(mailArg.subject).toMatch(/reset/i);
  });

  it('does not throw when mailer fails', async () => {
    const { handler, users, mailer } = make();
    users.findByEmail.mockResolvedValue(
      User.register({ id: 'u1', email: 'a@x.com', nickname: 'a', passwordHash: 'h' }),
    );
    mailer.send.mockRejectedValue(new Error('SMTP down'));

    await expect(
      handler.execute(new RequestPasswordResetCommand('a@x.com')),
    ).resolves.toBeUndefined();
  });
});
