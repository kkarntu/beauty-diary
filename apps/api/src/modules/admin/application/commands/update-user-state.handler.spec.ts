import { ForbiddenError } from '../../../../common/errors/domain.errors';
import type { RefreshTokenRepository } from '../../../auth/domain/ports/refresh-token.repository';
import type { UserRepository } from '../../../users/domain/ports/user.repository';
import { User } from '../../../users/domain/user.entity';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import type { AuditLogRepository } from '../../domain/ports/audit-log.repository';
import { UpdateUserStateCommand } from './update-user-state.command';
import { UpdateUserStateHandler } from './update-user-state.handler';

describe('UpdateUserStateHandler', () => {
  const make = () => {
    const users: jest.Mocked<UserRepository> = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByNickname: jest.fn(),
      save: jest.fn(),
    };
    const refreshTokens: jest.Mocked<RefreshTokenRepository> = {
      findById: jest.fn(),
      save: jest.fn(),
      revokeAllForUser: jest.fn(),
      deleteExpired: jest.fn(),
    };
    const auditLogs: jest.Mocked<AuditLogRepository> = {
      save: jest.fn(),
      list: jest.fn(),
    };
    return {
      users,
      refreshTokens,
      auditLogs,
      handler: new UpdateUserStateHandler(users, refreshTokens, auditLogs),
    };
  };

  const sample = () =>
    User.register({ id: 'target', email: 'a@x.com', nickname: 'a', passwordHash: 'h' });

  it('refuses self-modification', async () => {
    const { handler } = make();
    await expect(
      handler.execute(new UpdateUserStateCommand('self', 'self', { isBlocked: true })),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws when target user is missing', async () => {
    const { handler, users } = make();
    users.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new UpdateUserStateCommand('admin', 'target', { isBlocked: true })),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('blocks user, revokes tokens, writes audit entry', async () => {
    const { handler, users, refreshTokens, auditLogs } = make();
    users.findById.mockResolvedValue(sample());

    await handler.execute(new UpdateUserStateCommand('admin', 'target', { isBlocked: true }));

    expect(users.save).toHaveBeenCalled();
    expect(users.save.mock.calls[0]![0].isBlocked).toBe(true);
    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('target');
    expect(auditLogs.save).toHaveBeenCalled();
    const audit = auditLogs.save.mock.calls[0]![0].toSnapshot();
    expect(audit.actorId).toBe('admin');
    expect(audit.targetId).toBe('target');
    expect(audit.metadata.isBlockedTo).toBe(true);
  });

  it('changes role', async () => {
    const { handler, users, auditLogs } = make();
    users.findById.mockResolvedValue(sample());

    await handler.execute(new UpdateUserStateCommand('admin', 'target', { role: 'admin' }));

    const saved = users.save.mock.calls[0]![0];
    expect(saved.role).toBe('admin');
    const audit = auditLogs.save.mock.calls[0]![0].toSnapshot();
    expect(audit.metadata.roleFrom).toBe('user');
    expect(audit.metadata.roleTo).toBe('admin');
  });

  it('is a no-op when nothing changes', async () => {
    const { handler, users, refreshTokens, auditLogs } = make();
    users.findById.mockResolvedValue(sample());

    await handler.execute(new UpdateUserStateCommand('admin', 'target', { isBlocked: false }));

    expect(users.save).not.toHaveBeenCalled();
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
    expect(auditLogs.save).not.toHaveBeenCalled();
  });
});
