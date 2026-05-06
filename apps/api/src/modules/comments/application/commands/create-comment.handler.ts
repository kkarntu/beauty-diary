import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, type ICommandHandler } from '@nestjs/cqrs';
import { v7 as uuidv7 } from 'uuid';
import { POST_REPOSITORY, type PostRepository } from '../../../posts/domain/ports/post.repository';
import { PostNotFoundError } from '../../../posts/domain/post.errors';
import { Comment } from '../../domain/comment.entity';
import {
  CannotReplyToReplyError,
  CommentNotFoundError,
  CommentsDisabledError,
} from '../../domain/comment.errors';
import { COMMENT_REPOSITORY, type CommentRepository } from '../../domain/ports/comment.repository';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CreateCommentCommand, type CreateCommentResult } from './create-comment.command';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler implements ICommandHandler<
  CreateCommentCommand,
  CreateCommentResult
> {
  constructor(
    @Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepository,
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateCommentCommand): Promise<CreateCommentResult> {
    const post = await this.posts.findById(cmd.postId);
    if (!post || !post.isPublished) {
      throw new PostNotFoundError();
    }
    if (!post.allowComments) {
      throw new CommentsDisabledError();
    }

    if (cmd.parentId) {
      const parent = await this.comments.findById(cmd.parentId);
      if (!parent || parent.postId !== cmd.postId) {
        throw new CommentNotFoundError();
      }
      if (parent.isReply) {
        throw new CannotReplyToReplyError();
      }
    }

    const comment = Comment.create({
      id: uuidv7(),
      postId: cmd.postId,
      authorId: cmd.authorId,
      parentId: cmd.parentId,
      content: cmd.content,
    });
    await this.comments.save(comment);

    post.incrementCommentsCount();
    await this.posts.save(post);

    this.eventBus.publish(new CommentCreatedEvent(comment.id, comment.postId, comment.authorId));

    return { id: comment.id };
  }
}
