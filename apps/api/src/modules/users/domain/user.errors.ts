import { ConflictError, NotFoundError } from '../../../common/errors/domain.errors';

export class EmailAlreadyTakenError extends ConflictError {
  constructor() {
    super('Email is already registered', 'EMAIL_TAKEN');
  }
}

export class NicknameAlreadyTakenError extends ConflictError {
  constructor() {
    super('Nickname is already taken', 'NICKNAME_TAKEN');
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('User not found', 'USER_NOT_FOUND');
  }
}
