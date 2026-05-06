import { Module } from '@nestjs/common';
import { TOKEN_SERVICE } from './domain/ports/token-service';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { AuthGuard } from './presentation/guards/auth.guard';
import { OptionalAuthGuard } from './presentation/guards/optional-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

/**
 * Bits of auth other modules need: the AuthGuard for protecting their
 * routes and the TOKEN_SERVICE for verifying tokens. Pulling these out
 * of AuthModule lets UsersModule import them without creating a circular
 * dependency (AuthModule depends on UsersModule for the user repo).
 */
@Module({
  providers: [
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    AuthGuard,
    OptionalAuthGuard,
    RolesGuard,
  ],
  exports: [TOKEN_SERVICE, AuthGuard, OptionalAuthGuard, RolesGuard],
})
export class AuthSharedModule {}
