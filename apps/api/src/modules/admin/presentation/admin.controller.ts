import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  AdminUserListQueryDto,
  type AdminUserListResponseDto,
  AuditLogQueryDto,
  type AuditLogListResponseDto,
  UpdateUserStateDto,
} from '@beauty-diary/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { UpdateUserStateCommand } from '../application/commands/update-user-state.command';
import {
  ListAdminUsersQuery,
  type ListAdminUsersResult,
} from '../application/queries/list-admin-users.query';
import {
  ListAuditLogQuery,
  type ListAuditLogResult,
} from '../application/queries/list-audit-log.query';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(['admin'])
export class AdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('users')
  async listUsers(
    @Query(new ZodValidationPipe(AdminUserListQueryDto)) query: AdminUserListQueryDto,
  ): Promise<AdminUserListResponseDto> {
    return this.queryBus.execute<ListAdminUsersQuery, ListAdminUsersResult>(
      new ListAdminUsersQuery(
        query.page,
        query.pageSize,
        query.role,
        query.isBlocked,
        query.search,
      ),
    );
  }

  @Patch('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateUserState(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserStateDto)) body: UpdateUserStateDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateUserStateCommand(actor.id, id, {
        isBlocked: body.isBlocked,
        role: body.role,
      }),
    );
  }

  @Get('audit-log')
  async listAuditLog(
    @Query(new ZodValidationPipe(AuditLogQueryDto)) query: AuditLogQueryDto,
  ): Promise<AuditLogListResponseDto> {
    return this.queryBus.execute<ListAuditLogQuery, ListAuditLogResult>(
      new ListAuditLogQuery(query.page, query.pageSize, query.action, query.targetType),
    );
  }
}
