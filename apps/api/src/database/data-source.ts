import 'reflect-metadata';
import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';

// CLI usage (typeorm-ts-node-commonjs) won't go through Nest, so we load .env manually.
loadEnv({ path: path.resolve(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required. Either set it in apps/api/.env or in your shell environment.',
  );
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl,
  entities: [path.join(__dirname, '..', 'modules', '**', '*.orm-entity.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
};

export const AppDataSource = new DataSource(dataSourceOptions);
