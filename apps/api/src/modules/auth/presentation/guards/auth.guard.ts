import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { UnauthorizedError } from '../../../../common/errors/domain.errors';
import { TOKEN_SERVICE, type TokenService } from '../../domain/ports/token-service';
import { ACCESS_COOKIE_NAME } from '../cookies/auth-cookies';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedError('Missing access token');
    }
    try {
      const payload = this.tokens.verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedError('Invalid access token');
    }
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
