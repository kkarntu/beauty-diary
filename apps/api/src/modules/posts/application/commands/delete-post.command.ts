import type { UserRole } from '@beauty-diary/shared';

export class DeletePostCommand {
  constructor(
    public readonly postId: string,
    public readonly actorId: string,
    public readonly actorRole: UserRole,
  ) {}
}
