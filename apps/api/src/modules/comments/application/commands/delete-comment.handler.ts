import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { CommentNotFoundError, NotCommentAuthorError } from '../../domain/comment.errors';
import { COMMENT_REPOSITORY, type CommentRepository } from '../../domain/ports/comment.repository';
import { CommentDeletedEvent } from '../events/comment-deleted.event';
import { DeleteCommentCommand } from './delete-comment.command';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand, void> {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: DeleteCommentCommand): Promise<void> {
    const comment = await this.comments.findById(cmd.commentId);
    if (!comment || comment.isDeleted) {
      throw new CommentNotFoundError();
    }
    if (!comment.isOwnedBy(cmd.actorId) && cmd.actorRole !== 'admin') {
      throw new NotCommentAuthorError();
    }
    comment.softDelete();
    await this.comments.save(comment);
    this.eventBus.publish(new CommentDeletedEvent(comment.id, comment.postId));
  }
}
