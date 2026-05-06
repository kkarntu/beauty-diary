import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvModule } from '../../config/env.module';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { CommentsModule } from '../comments/comments.module';
import { MAILER, type Mailer } from '../auth/domain/ports/mailer';
import { NodemailerMailer } from '../auth/infrastructure/nodemailer-mailer';
import { ResendMailer } from '../auth/infrastructure/resend-mailer';
import { EnvService } from '../../config/env.service';
import { PostsModule } from '../posts/posts.module';
import { UsersModule } from '../users/users.module';
import { CommentCreatedNotifyHandler } from './application/events/comment-created-notify.handler';
import { PostLikedNotifyHandler } from './application/events/post-liked-notify.handler';
import { UserFollowedNotifyHandler } from './application/events/user-followed-notify.handler';
import { OutboxProcessorService } from './application/outbox-processor.service';
import { NOTIFICATION_REPOSITORY } from './domain/ports/notification.repository';
import { EMAIL_OUTBOX_REPOSITORY } from './domain/ports/outbox.repository';
import { NOTIFICATION_PREFERENCES_REPOSITORY } from './domain/ports/preferences.repository';
import { EmailOutboxOrmEntity } from './infrastructure/persistence/email-outbox.orm-entity';
import { NotificationOrmEntity } from './infrastructure/persistence/notification.orm-entity';
import { NotificationPreferencesOrmEntity } from './infrastructure/persistence/notification-preferences.orm-entity';
import { TypeOrmEmailOutboxRepository } from './infrastructure/persistence/typeorm-email-outbox.repository';
import { TypeOrmNotificationRepository } from './infrastructure/persistence/typeorm-notification.repository';
import { TypeOrmNotificationPreferencesRepository } from './infrastructure/persistence/typeorm-notification-preferences.repository';
import { AdminOutboxController } from './presentation/admin-outbox.controller';
import { NotificationsController } from './presentation/notifications.controller';
import { NotificationPreferencesController } from './presentation/preferences.controller';

@Module({
  imports: [
    CqrsModule,
    EnvModule,
    AuthSharedModule,
    ScheduleModule.forRoot(),
    UsersModule,
    PostsModule,
    CommentsModule,
    TypeOrmModule.forFeature([
      EmailOutboxOrmEntity,
      NotificationPreferencesOrmEntity,
      NotificationOrmEntity,
    ]),
  ],
  controllers: [NotificationsController, NotificationPreferencesController, AdminOutboxController],
  providers: [
    CommentCreatedNotifyHandler,
    UserFollowedNotifyHandler,
    PostLikedNotifyHandler,
    OutboxProcessorService,
    NodemailerMailer,
    ResendMailer,
    {
      provide: MAILER,
      inject: [EnvService, NodemailerMailer, ResendMailer],
      useFactory: (env: EnvService, smtp: NodemailerMailer, resend: ResendMailer): Mailer =>
        env.mailDriver === 'resend' ? resend : smtp,
    },
    { provide: EMAIL_OUTBOX_REPOSITORY, useClass: TypeOrmEmailOutboxRepository },
    {
      provide: NOTIFICATION_PREFERENCES_REPOSITORY,
      useClass: TypeOrmNotificationPreferencesRepository,
    },
    { provide: NOTIFICATION_REPOSITORY, useClass: TypeOrmNotificationRepository },
  ],
  exports: [EMAIL_OUTBOX_REPOSITORY],
})
export class NotificationsModule {}
