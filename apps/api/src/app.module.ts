import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { EnvModule } from './config/env.module';
import { EnvService } from './config/env.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FollowsModule } from './modules/follows/follows.module';
import { MediaModule } from './modules/media/media.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PostsModule } from './modules/posts/posts.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

@Module({
  imports: [
    EnvModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    // Rate limiting is effectively disabled when NODE_ENV=test so the
    // integration suites — which create dozens of users in a single run — don't
    // collide with the limit. Per-route @Throttle() overrides still apply
    // outside of tests.
    ThrottlerModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => [
        {
          ttl: 60_000,
          limit: env.isTest ? 100_000 : 100,
        },
      ],
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    MediaModule,
    AdminModule,
    NewsletterModule,
    FollowsModule,
    NotificationsModule,
    RealtimeModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
