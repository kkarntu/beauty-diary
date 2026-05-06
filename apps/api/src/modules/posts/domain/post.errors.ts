import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../../common/errors/domain.errors';

export class PostNotFoundError extends NotFoundError {
  constructor() {
    super('Post not found', 'POST_NOT_FOUND');
  }
}

export class PostSlugConflictError extends ConflictError {
  constructor() {
    super('Post slug is already taken', 'POST_SLUG_CONFLICT');
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor() {
    super('Category not found', 'CATEGORY_NOT_FOUND');
  }
}

export class NotPostAuthorError extends ForbiddenError {
  constructor() {
    super('Only the author can modify this post', 'NOT_POST_AUTHOR');
  }
}

export class InvalidPostStatusTransitionError extends ValidationError {
  constructor(from: string, to: string) {
    super(`Cannot transition post from ${from} to ${to}`, 'INVALID_STATUS_TRANSITION');
  }
}
