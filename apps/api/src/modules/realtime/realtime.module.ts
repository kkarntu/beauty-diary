import { Module } from '@nestjs/common';
import { EnvModule } from '../../config/env.module';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [EnvModule, AuthSharedModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
