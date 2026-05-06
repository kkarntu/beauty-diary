import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import {
  type NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from '@beauty-diary/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthGuard } from '../../auth/presentation/guards/auth.guard';
import {
  NOTIFICATION_PREFERENCES_REPOSITORY,
  type NotificationPreferencesRepository,
} from '../domain/ports/preferences.repository';

@Controller('me/notification-preferences')
@UseGuards(AuthGuard)
export class NotificationPreferencesController {
  constructor(
    @Inject(NOTIFICATION_PREFERENCES_REPOSITORY)
    private readonly prefs: NotificationPreferencesRepository,
  ) {}

  @Get()
  async get(@CurrentUser() user: AuthenticatedUser): Promise<NotificationPreferencesDto> {
    return this.prefs.findByUserId(user.id);
  }

  @Patch()
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateNotificationPreferencesDto))
    body: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.prefs.upsert(user.id, body);
  }
}
