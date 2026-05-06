import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../common/errors/domain.errors';

export class CommentNotFoundError extends NotFoundError {
  constructor() {
    super('Comment not found', 'COMMENT_NOT_FOUND');
  }
}

export class CannotReplyToReplyError extends ValidationError {
  constructor() {
    super('Replies are limited to one level deep', 'NESTED_REPLY_NOT_ALLOWED');
  }
}

export class NotCommentAuthorError extends ForbiddenError {
  constructor() {
    super('Only the author can modify this comment', 'NOT_COMMENT_AUTHOR');
  }
}

export class CommentsDisabledError extends ForbiddenError {
  constructor() {
    super('Comments are disabled on this post', 'COMMENTS_DISABLED');
  }
}
