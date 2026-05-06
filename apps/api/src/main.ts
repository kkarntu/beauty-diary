import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { EnvService } from './config/env.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const env = app.get(EnvService);
  const logger = new Logger('Bootstrap');

  // `cross-origin` CORP is required for the Socket.IO handshake to
  // succeed when the web app and API are served from different origins.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser(env.cookieSecret));

  app.enableCors({
    origin: env.webOrigin,
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const port = env.port;
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}`);
  logger.log(`CORS origin: ${env.webOrigin}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', err);
  process.exit(1);
});
