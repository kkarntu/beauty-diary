import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import {
  LoginDto,
  RegisterDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  type CurrentUserDto,
} from '@beauty-diary/shared';
import type { Request, Response } from 'express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { LoginUserCommand, type LoginUserResult } from '../application/commands/login-user.command';
import { LogoutUserCommand } from '../application/commands/logout-user.command';
import {
  RefreshTokensCommand,
  type RefreshTokensResult,
} from '../application/commands/refresh-tokens.command';
import {
  RegisterUserCommand,
  type RegisterUserResult,
} from '../application/commands/register-user.command';
import { RequestPasswordResetCommand } from '../application/commands/request-password-reset.command';
import { ResetPasswordCommand } from '../application/commands/reset-password.command';
import {
  GetCurrentUserQuery,
  type GetCurrentUserResult,
} from '../application/queries/get-current-user.query';
import { REFRESH_COOKIE_NAME, clearAuthCookies, writeAuthCookies } from './cookies/auth-cookies';
import { AuthGuard } from './guards/auth.guard';
import { EnvService } from '../../../config/env.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly env: EnvService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async register(
    @Body(new ZodValidationPipe(RegisterDto)) body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ id: string }> {
    const result = await this.commandBus.execute<RegisterUserCommand, RegisterUserResult>(
      new RegisterUserCommand(body.email, body.password, body.nickname),
    );
    writeAuthCookies(res, this.env, result);
    return { id: result.userId };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body(new ZodValidationPipe(LoginDto)) body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ id: string }> {
    const result = await this.commandBus.execute<LoginUserCommand, LoginUserResult>(
      new LoginUserCommand(body.email, body.password),
    );
    writeAuthCookies(res, this.env, result);
    return { id: result.userId };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ id: string }> {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    const result = await this.commandBus.execute<RefreshTokensCommand, RefreshTokensResult>(
      new RefreshTokensCommand(raw ?? ''),
    );
    writeAuthCookies(res, this.env, result);
    return { id: result.userId };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
    await this.commandBus.execute(new LogoutUserCommand(raw));
    clearAuthCookies(res, this.env);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser): Promise<CurrentUserDto> {
    return this.queryBus.execute<GetCurrentUserQuery, GetCurrentUserResult>(
      new GetCurrentUserQuery(user.id),
    );
  }

  @Post('password/request-reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async requestPasswordReset(
    @Body(new ZodValidationPipe(RequestPasswordResetDto)) body: RequestPasswordResetDto,
  ): Promise<void> {
    await this.commandBus.execute(new RequestPasswordResetCommand(body.email));
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordDto)) body: ResetPasswordDto,
  ): Promise<void> {
    await this.commandBus.execute(new ResetPasswordCommand(body.token, body.password));
  }
}
