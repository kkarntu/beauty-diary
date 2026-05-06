import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { CommentNotFoundError, NotCommentAuthorError } from '../../domain/comment.errors';
import { COMMENT_REPOSITORY, type CommentRepository } from '../../domain/ports/comment.repository';
import { CommentUpdatedEvent } from '../events/comment-updated.event';
import { UpdateCommentCommand } from './update-comment.command';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand, void> {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateCommentCommand): Promise<void> {
    const comment = await this.comments.findById(cmd.commentId);
    if (!comment || comment.isDeleted) {
      throw new CommentNotFoundError();
    }
    if (!comment.isOwnedBy(cmd.actorId) && cmd.actorRole !== 'admin') {
      throw new NotCommentAuthorError();
    }
    comment.editContent(cmd.content);
    await this.comments.save(comment);
    this.eventBus.publish(new CommentUpdatedEvent(comment.id, comment.postId));
  }
}
