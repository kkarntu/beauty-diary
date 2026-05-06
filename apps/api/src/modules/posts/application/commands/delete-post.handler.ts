import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { NotPostAuthorError, PostNotFoundError } from '../../domain/post.errors';
import { POST_REPOSITORY, type PostRepository } from '../../domain/ports/post.repository';
import { DeletePostCommand } from './delete-post.command';

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand, void> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: PostRepository) {}

  async execute(cmd: DeletePostCommand): Promise<void> {
    const post = await this.posts.findById(cmd.postId);
    if (!post) {
      throw new PostNotFoundError();
    }
    if (!post.isOwnedBy(cmd.actorId) && cmd.actorRole !== 'admin') {
      throw new NotPostAuthorError();
    }
    await this.posts.delete(post.id);
  }
}
