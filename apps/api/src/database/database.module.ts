import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvService } from '../config/env.service';
import { dataSourceOptions } from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        ...dataSourceOptions,
        url: env.databaseUrl,
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
