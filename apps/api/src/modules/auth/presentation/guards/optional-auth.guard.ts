import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { TOKEN_SERVICE, type TokenService } from '../../domain/ports/token-service';
import { ACCESS_COOKIE_NAME } from '../cookies/auth-cookies';

/**
 * Sets `req.user` if a valid access token is present, but never throws.
 * Use on public endpoints that personalise their response when the caller
 * is logged in (e.g. exposing `isLikedByMe` on posts).
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = this.extractToken(req);
    if (!token) return true;
    try {
      const payload = this.tokens.verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      // Ignored — public route, just behave as anonymous.
    }
    return true;
  }

  private extractToken(req: Request): string | undefined {
    const cookieToken = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE_NAME];
    if (cookieToken) return cookieToken;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return undefined;
  }
}
