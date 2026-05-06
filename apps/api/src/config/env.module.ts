import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvSchema, type Env } from './env.schema';
import { EnvService } from './env.service';

/**
 * Validates process.env at boot using EnvSchema.
 * If anything is missing or malformed, the app fails to start with a clear
 * error message — preferred over discovering it later at runtime.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (raw): Env => {
        const parsed = EnvSchema.safeParse(raw);
        if (!parsed.success) {
          const issues = parsed.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
          new Logger('EnvModule').error(`Invalid environment configuration:\n${issues}`);
          throw new Error('Environment validation failed; see logs above.');
        }
        return parsed.data;
      },
    }),
  ],
  providers: [
    {
      provide: EnvService,
      useFactory: (): EnvService => new EnvService(EnvSchema.parse(process.env)),
    },
  ],
  exports: [EnvService],
})
export class EnvModule {}
