import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InitiateRegisterHandler } from './application/commands/initiate-register.handler';
import { LoginUserHandler } from './application/commands/login-user.handler';
import { LogoutUserHandler } from './application/commands/logout-user.handler';
import { RefreshTokensHandler } from './application/commands/refresh-tokens.handler';
import { RegisterUserHandler } from './application/commands/register-user.handler';
import { RequestPasswordResetHandler } from './application/commands/request-password-reset.handler';
import { ResendRegisterOtpHandler } from './application/commands/resend-register-otp.handler';
import { ResetPasswordHandler } from './application/commands/reset-password.handler';
import { VerifyRegisterHandler } from './application/commands/verify-register.handler';
import { GetCurrentUserHandler } from './application/queries/get-current-user.handler';
import { AuthSharedModule } from './auth-shared.module';
import { PASSWORD_HASHER } from './domain/ports/password-hasher';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/ports/password-reset-token.repository';
import { PENDING_REGISTRATION_REPOSITORY } from './domain/ports/pending-registration.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/ports/refresh-token.repository';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { PasswordResetTokenOrmEntity } from './infrastructure/persistence/password-reset-token.orm-entity';
import { PendingRegistrationOrmEntity } from './infrastructure/persistence/pending-registration.orm-entity';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/refresh-token.orm-entity';
import { TypeOrmPasswordResetTokenRepository } from './infrastructure/persistence/typeorm-password-reset-token.repository';
import { TypeOrmPendingRegistrationRepository } from './infrastructure/persistence/typeorm-pending-registration.repository';
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm-refresh-token.repository';
import { AuthController } from './presentation/auth.controller';

const commandHandlers = [
  RegisterUserHandler,
  InitiateRegisterHandler,
  VerifyRegisterHandler,
  ResendRegisterOtpHandler,
  LoginUserHandler,
  RefreshTokensHandler,
  LogoutUserHandler,
  RequestPasswordResetHandler,
  ResetPasswordHandler,
];
const queryHandlers = [GetCurrentUserHandler];

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    UsersModule,
    NotificationsModule, // for EMAIL_OUTBOX_REPOSITORY
    TypeOrmModule.forFeature([
      RefreshTokenOrmEntity,
      PasswordResetTokenOrmEntity,
      PendingRegistrationOrmEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: TypeOrmRefreshTokenRepository },
    { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useClass: TypeOrmPasswordResetTokenRepository },
    {
      provide: PENDING_REGISTRATION_REPOSITORY,
      useClass: TypeOrmPendingRegistrationRepository,
    },
  ],
  exports: [REFRESH_TOKEN_REPOSITORY],
})
export class AuthModule {}
