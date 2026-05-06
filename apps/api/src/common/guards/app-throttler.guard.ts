import { type ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Wraps the standard ThrottlerGuard so we can opt out of rate limiting
 * when NODE_ENV=test. The integration suites register many users in a tight loop
 * and would otherwise trip the per-route @Throttle() decorators on auth
 * endpoints.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;
    return super.canActivate(context);
  }
}
