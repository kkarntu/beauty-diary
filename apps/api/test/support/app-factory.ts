import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from '../../src/app.module';
import { EnvService } from '../../src/config/env.service';

/**
 * Boots a Nest app for integration tests. Uses whatever DATABASE_URL is in the
 * environment — the CI test job points it at a service-container Postgres,
 * locally you can point it at the docker-compose Postgres.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ bufferLogs: true });
  const env = app.get(EnvService);

  app.use(helmet());
  app.use(cookieParser(env.cookieSecret));
  app.enableCors({ origin: env.webOrigin, credentials: true });
  app.setGlobalPrefix('api', { exclude: ['health'] });

  Logger.overrideLogger(false);
  await app.init();
  return app;
}
