import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '@beauty-diary/shared';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

/**
 * Reads the authenticated user attached to the request by AuthGuard.
 * Returns undefined for anonymous routes — guard placement is what
 * guarantees presence, not this decorator.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    return req.user;
  },
);
