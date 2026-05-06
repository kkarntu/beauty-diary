import { ValidationError } from '../../../common/errors/domain.errors';

export class CannotFollowSelfError extends ValidationError {
  constructor() {
    super('You cannot follow yourself.', 'FOLLOW_SELF_FORBIDDEN');
  }
}
