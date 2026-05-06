import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotPostAuthorError, PostNotFoundError } from '../../domain/post.errors';
import { POST_REPOSITORY, type PostRepository } from '../../domain/ports/post.repository';
import { ArchivePostCommand, PublishPostCommand } from './publish-post.command';

@CommandHandler(PublishPostCommand)
export class PublishPostHandler implements ICommandHandler<PublishPostCommand, void> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: PostRepository) {}

  async execute(cmd: PublishPostCommand): Promise<void> {
    const post = await this.posts.findById(cmd.postId);
    if (!post) {
      throw new PostNotFoundError();
    }
    if (!post.isOwnedBy(cmd.actorId) && cmd.actorRole !== 'admin') {
      throw new NotPostAuthorError();
    }
    post.publish();
    await this.posts.save(post);
  }
}

@CommandHandler(ArchivePostCommand)
export class ArchivePostHandler implements ICommandHandler<ArchivePostCommand, void> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: PostRepository) {}

  async execute(cmd: ArchivePostCommand): Promise<void> {
    const post = await this.posts.findById(cmd.postId);
    if (!post) {
      throw new PostNotFoundError();
    }
    if (!post.isOwnedBy(cmd.actorId) && cmd.actorRole !== 'admin') {
      throw new NotPostAuthorError();
    }
    post.archive();
    await this.posts.save(post);
  }
}
