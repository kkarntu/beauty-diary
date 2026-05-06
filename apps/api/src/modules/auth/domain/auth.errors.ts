import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../../common/errors/domain.errors';

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
  }
}

export class AccountBlockedError extends UnauthorizedError {
  constructor() {
    super('Account is blocked', 'ACCOUNT_BLOCKED');
  }
}

export class InvalidRefreshTokenError extends UnauthorizedError {
  constructor() {
    super('Refresh token is invalid or expired', 'INVALID_REFRESH_TOKEN');
  }
}

export class RefreshTokenReusedError extends UnauthorizedError {
  constructor() {
    super('Refresh token reuse detected; all sessions revoked', 'REFRESH_TOKEN_REUSED');
  }
}

export class InvalidPasswordResetTokenError extends NotFoundError {
  constructor() {
    super('Password reset token is invalid or expired', 'INVALID_RESET_TOKEN');
  }
}

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
