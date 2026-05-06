import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from '../../src/app.module';
import { EnvService } from '../../src/config/env.service';

/**
 * Boots a Nest app for integration tests. Uses whatever DATABASE_URL is in
 * the environment — the CI test job points it at a service-container
 * Postgres; locally you can point it at the docker-compose Postgres.
 *
 * Returns the app plus a `close()` helper that drains in-flight async
 * event handlers (notifications) before tearing down. Without that drain,
 * fire-and-forget handlers can still be querying the DB when the test
 * teardown closes the connection — Jest then panics on the late
 * "Cannot log after tests are done" output.
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

  const originalClose = app.close.bind(app);
  app.close = async () => {
    // Let pending CQRS event handlers (notification side effects) flush
    // before we tear down the DB connection.
    await new Promise((resolve) => setTimeout(resolve, 200));
    await originalClose();
  };

  return app;
}
