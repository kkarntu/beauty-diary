import type { UserRole } from '@beauty-diary/shared';

export class DeleteCommentCommand {
  constructor(
    public readonly commentId: string,
    public readonly actorId: string,
    public readonly actorRole: UserRole,
  ) {}
}
