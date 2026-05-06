import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { UsersModule } from '../users/users.module';
import {
  FollowUserHandler,
  UnfollowUserHandler,
} from './application/commands/follow-user.handler';
import { FOLLOW_REPOSITORY } from './domain/ports/follow.repository';
import { UserFollowOrmEntity } from './infrastructure/persistence/user-follow.orm-entity';
import { TypeOrmFollowRepository } from './infrastructure/persistence/typeorm-follow.repository';
import { FollowsController } from './presentation/follows.controller';

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    UsersModule,
    TypeOrmModule.forFeature([UserFollowOrmEntity]),
  ],
  controllers: [FollowsController],
  providers: [
    FollowUserHandler,
    UnfollowUserHandler,
    {
      provide: FOLLOW_REPOSITORY,
      useClass: TypeOrmFollowRepository,
    },
  ],
  exports: [FOLLOW_REPOSITORY],
})
export class FollowsModule {}
