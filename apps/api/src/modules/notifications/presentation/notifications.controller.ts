import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  NotificationDto,
  NotificationListResponseDto,
  NotificationType,
} from '@beauty-diary/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
  type NotificationRow,
} from '../domain/ports/notification.repository';

@Controller('me/notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') pageRaw?: string,
    @Query('pageSize') pageSizeRaw?: string,
  ): Promise<NotificationListResponseDto> {
    const page = Math.max(1, Number(pageRaw) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw) || 20));
    const { items, total, unreadCount } = await this.notifications.listByUser(
      user.id,
      page,
      pageSize,
    );
    return {
      items: items.map(toDto),
      unreadCount,
      total,
      page,
      pageSize,
    };
  }

  @Get('unread-count')
  async unread(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notifications.unreadCount(user.id);
    return { unreadCount };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notifications.markRead(user.id, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.notifications.markAllRead(user.id);
  }
}

function toDto(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    type: row.type as NotificationType,
    payload: row.payload,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
