import type { UserRole } from '@beauty-diary/shared';

export class UpdateUserStateCommand {
  constructor(
    public readonly actorId: string,
    public readonly targetUserId: string,
    public readonly input: {
      isBlocked?: boolean;
      role?: UserRole;
    },
  ) {}
}
