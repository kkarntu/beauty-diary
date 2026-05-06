import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { POST_REPOSITORY, type PostRepository } from '../../../posts/domain/ports/post.repository';
import { PostNotFoundError } from '../../../posts/domain/post.errors';
import {
  REACTION_REPOSITORY,
  type ReactionRepository,
} from '../../domain/ports/reaction.repository';
import { PostLikedEvent } from '../events/post-liked.event';
import { PostUnlikedEvent } from '../events/post-unliked.event';
import {
  FavoritePostCommand,
  LikePostCommand,
  UnfavoritePostCommand,
  UnlikePostCommand,
} from './like-post.command';

async function assertPublishedPostExists(posts: PostRepository, postId: string): Promise<void> {
  const post = await posts.findById(postId);
  if (!post || !post.isPublished) {
    throw new PostNotFoundError();
  }
}

@CommandHandler(LikePostCommand)
export class LikePostHandler implements ICommandHandler<LikePostCommand, void> {
  constructor(
    @Inject(REACTION_REPOSITORY) private readonly reactions: ReactionRepository,
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: LikePostCommand): Promise<void> {
    await assertPublishedPostExists(this.posts, cmd.postId);
    const inserted = await this.reactions.like(cmd.userId, cmd.postId);
    // Idempotent re-likes shouldn't re-notify the author.
    if (inserted) {
      this.eventBus.publish(new PostLikedEvent(cmd.userId, cmd.postId));
    }
  }
}

@CommandHandler(UnlikePostCommand)
export class UnlikePostHandler implements ICommandHandler<UnlikePostCommand, void> {
  constructor(
    @Inject(REACTION_REPOSITORY) private readonly reactions: ReactionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UnlikePostCommand): Promise<void> {
    const removed = await this.reactions.unlike(cmd.userId, cmd.postId);
    if (removed) {
      this.eventBus.publish(new PostUnlikedEvent(cmd.userId, cmd.postId));
    }
  }
}

@CommandHandler(FavoritePostCommand)
export class FavoritePostHandler implements ICommandHandler<FavoritePostCommand, void> {
  constructor(
    @Inject(REACTION_REPOSITORY) private readonly reactions: ReactionRepository,
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
  ) {}

  async execute(cmd: FavoritePostCommand): Promise<void> {
    await assertPublishedPostExists(this.posts, cmd.postId);
    await this.reactions.favorite(cmd.userId, cmd.postId);
  }
}

@CommandHandler(UnfavoritePostCommand)
export class UnfavoritePostHandler implements ICommandHandler<UnfavoritePostCommand, void> {
  constructor(@Inject(REACTION_REPOSITORY) private readonly reactions: ReactionRepository) {}

  async execute(cmd: UnfavoritePostCommand): Promise<void> {
    await this.reactions.unfavorite(cmd.userId, cmd.postId);
  }
}
