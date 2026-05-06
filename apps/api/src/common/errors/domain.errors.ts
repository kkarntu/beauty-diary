/**
 * Domain-layer errors. The presentation layer (controllers / global filter)
 * maps these to HTTP status codes — no `throw new HttpException` inside
 * domain or application code.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, code);
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, code);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, code);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, code);
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'Validation failed', code = 'VALIDATION') {
    super(message, code);
  }
}

export class RateLimitError extends DomainError {
  constructor(message = 'Too many requests', code = 'RATE_LIMITED') {
    super(message, code);
  }
}
