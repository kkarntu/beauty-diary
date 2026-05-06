import type { UserRole } from '@beauty-diary/shared';

export class PublishPostCommand {
  constructor(
    public readonly postId: string,
    public readonly actorId: string,
    public readonly actorRole: UserRole,
  ) {}
}

export class ArchivePostCommand {
  constructor(
    public readonly postId: string,
    public readonly actorId: string,
    public readonly actorRole: UserRole,
  ) {}
}
