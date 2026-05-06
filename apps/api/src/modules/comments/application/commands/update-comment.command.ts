import type { UserRole } from '@beauty-diary/shared';

export class UpdateCommentCommand {
  constructor(
    public readonly commentId: string,
    public readonly actorId: string,
    public readonly actorRole: UserRole,
    public readonly content: string,
  ) {}
}
