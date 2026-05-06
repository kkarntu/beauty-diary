import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { v7 as uuidv7 } from 'uuid';
import { ForbiddenError } from '../../../../common/errors/domain.errors';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../../../auth/domain/ports/refresh-token.repository';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import { UserNotFoundError } from '../../../users/domain/user.errors';
import { AuditLogEntry } from '../../domain/audit-log.entity';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
} from '../../domain/ports/audit-log.repository';
import { UpdateUserStateCommand } from './update-user-state.command';

@CommandHandler(UpdateUserStateCommand)
export class UpdateUserStateHandler implements ICommandHandler<UpdateUserStateCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogs: AuditLogRepository,
  ) {}

  async execute(cmd: UpdateUserStateCommand): Promise<void> {
    if (cmd.actorId === cmd.targetUserId) {
      throw new ForbiddenError(
        'Admins cannot modify their own role or block status',
        'CANNOT_MODIFY_SELF',
      );
    }

    const user = await this.users.findById(cmd.targetUserId);
    if (!user) {
      throw new UserNotFoundError();
    }

    let mutated = false;
    const metadata: Record<string, unknown> = {};

    if (cmd.input.isBlocked !== undefined) {
      const before = user.isBlocked;
      if (cmd.input.isBlocked) user.block();
      else user.unblock();
      if (before !== cmd.input.isBlocked) {
        mutated = true;
        metadata.isBlockedFrom = before;
        metadata.isBlockedTo = cmd.input.isBlocked;
      }
    }

    if (cmd.input.role !== undefined && cmd.input.role !== user.role) {
      const before = user.role;
      user.setRole(cmd.input.role);
      mutated = true;
      metadata.roleFrom = before;
      metadata.roleTo = cmd.input.role;
    }

    if (!mutated) return;

    await this.users.save(user);

    // Force re-login for security: invalidate all refresh tokens.
    await this.refreshTokens.revokeAllForUser(user.id);

    await this.auditLogs.save(
      AuditLogEntry.create({
        id: uuidv7(),
        actorId: cmd.actorId,
        action: cmd.input.isBlocked !== undefined ? 'user.state_changed' : 'user.role_changed',
        targetType: 'user',
        targetId: user.id,
        metadata,
      }),
    );
  }
}
