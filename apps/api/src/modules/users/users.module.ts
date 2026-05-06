import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { UpdateProfileHandler } from './application/commands/update-profile.handler';
import { GetUserByIdHandler } from './application/queries/get-user-by-id.handler';
import { GetUserByNicknameHandler } from './application/queries/get-user-by-nickname.handler';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { UserOrmEntity } from './infrastructure/persistence/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { UsersController } from './presentation/users.controller';

const queryHandlers = [GetUserByNicknameHandler, GetUserByIdHandler];
const commandHandlers = [UpdateProfileHandler];

@Module({
  imports: [CqrsModule, AuthSharedModule, TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
