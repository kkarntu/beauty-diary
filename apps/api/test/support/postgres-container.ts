import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, type DataSourceOptions } from 'typeorm';
import * as path from 'node:path';

export interface PostgresHandle {
  container: StartedPostgreSqlContainer;
  dataSource: DataSource;
  url: string;
}

/**
 * Spins up an ephemeral Postgres container, runs all migrations,
 * and returns a connected DataSource. Use from `beforeAll` in
 * integration test suites.
 */
export async function setupPostgres(): Promise<PostgresHandle> {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('beauty_diary_test')
    .withUsername('beauty')
    .withPassword('beauty')
    .start();

  const url = container.getConnectionUri();

  const options: DataSourceOptions = {
    type: 'postgres',
    url,
    entities: [path.join(__dirname, '..', '..', 'src', 'modules', '**', '*.orm-entity.{ts,js}')],
    migrations: [path.join(__dirname, '..', '..', 'src', 'migrations', '*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: false,
  };

  const dataSource = new DataSource(options);
  await dataSource.initialize();
  await dataSource.runMigrations();

  return { container, dataSource, url };
}

export async function teardownPostgres(handle: PostgresHandle): Promise<void> {
  if (handle.dataSource.isInitialized) {
    await handle.dataSource.destroy();
  }
  await handle.container.stop();
}

export async function truncateAll(dataSource: DataSource, tables: string[]): Promise<void> {
  if (tables.length === 0) return;
  const quoted = tables.map((t) => `"${t}"`).join(', ');
  await dataSource.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
}
