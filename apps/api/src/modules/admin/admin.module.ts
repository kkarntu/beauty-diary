import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { UsersModule } from '../users/users.module';
import { UserOrmEntity } from '../users/infrastructure/persistence/user.orm-entity';
import { UpdateUserStateHandler } from './application/commands/update-user-state.handler';
import { ListAdminUsersHandler } from './application/queries/list-admin-users.handler';
import { ListAuditLogHandler } from './application/queries/list-audit-log.handler';
import { AUDIT_LOG_REPOSITORY } from './domain/ports/audit-log.repository';
import { AdminSeederService } from './infrastructure/admin-seeder.service';
import { AuditLogOrmEntity } from './infrastructure/persistence/audit-log.orm-entity';
import { TypeOrmAuditLogRepository } from './infrastructure/persistence/typeorm-audit-log.repository';
import { AdminController } from './presentation/admin.controller';

@Module({
  imports: [
    CqrsModule,
    AuthSharedModule,
    AuthModule, // for REFRESH_TOKEN_REPOSITORY
    UsersModule,
    TypeOrmModule.forFeature([AuditLogOrmEntity, UserOrmEntity]),
  ],
  controllers: [AdminController],
  providers: [
    UpdateUserStateHandler,
    ListAdminUsersHandler,
    ListAuditLogHandler,
    AdminSeederService,
    { provide: AUDIT_LOG_REPOSITORY, useClass: TypeOrmAuditLogRepository },
  ],
})
export class AdminModule {}
