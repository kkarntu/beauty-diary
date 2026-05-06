import { v7 as uuidv7 } from 'uuid';
import { Repository } from 'typeorm';
import { User } from '../../../src/modules/users/domain/user.entity';
import { UserOrmEntity } from '../../../src/modules/users/infrastructure/persistence/user.orm-entity';
import { TypeOrmUserRepository } from '../../../src/modules/users/infrastructure/persistence/typeorm-user.repository';
import {
  type PostgresHandle,
  setupPostgres,
  teardownPostgres,
  truncateAll,
} from '../../support/postgres-container';

describe('TypeOrmUserRepository (integration)', () => {
  let pg: PostgresHandle;
  let ormRepo: Repository<UserOrmEntity>;
  let repo: TypeOrmUserRepository;

  beforeAll(async () => {
    pg = await setupPostgres();
    ormRepo = pg.dataSource.getRepository(UserOrmEntity);
    repo = new TypeOrmUserRepository(ormRepo);
  }, 60_000);

  afterAll(async () => {
    await teardownPostgres(pg);
  });

  beforeEach(async () => {
    await truncateAll(pg.dataSource, ['users']);
  });

  it('saves and finds by email (case-insensitive thanks to citext)', async () => {
    const user = User.register({
      id: uuidv7(),
      email: 'Bohdan@Mail.com',
      nickname: 'bohdan',
      passwordHash: 'h',
    });
    await repo.save(user);

    const found = await repo.findByEmail('bohdan@mail.com');
    expect(found).not.toBeNull();
    expect(found!.nickname).toBe('bohdan');
  });

  it('saves and finds by nickname (case-insensitive)', async () => {
    const user = User.register({
      id: uuidv7(),
      email: 'a@x.com',
      nickname: 'BohdanK',
      passwordHash: 'h',
    });
    await repo.save(user);

    const found = await repo.findByNickname('bohdank');
    expect(found?.email).toBe('a@x.com');
  });

  it('rejects duplicate email at the database level', async () => {
    const id1 = uuidv7();
    const id2 = uuidv7();
    await repo.save(
      User.register({ id: id1, email: 'dup@x.com', nickname: 'a', passwordHash: 'h' }),
    );
    await expect(
      repo.save(User.register({ id: id2, email: 'dup@x.com', nickname: 'b', passwordHash: 'h' })),
    ).rejects.toThrow();
  });
});
