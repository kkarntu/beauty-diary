import { v7 as uuidv7 } from 'uuid';
import { RefreshToken } from '../../../src/modules/auth/domain/refresh-token.entity';
import { RefreshTokenOrmEntity } from '../../../src/modules/auth/infrastructure/persistence/refresh-token.orm-entity';
import { TypeOrmRefreshTokenRepository } from '../../../src/modules/auth/infrastructure/persistence/typeorm-refresh-token.repository';
import { UserOrmEntity } from '../../../src/modules/users/infrastructure/persistence/user.orm-entity';
import {
  type PostgresHandle,
  setupPostgres,
  teardownPostgres,
  truncateAll,
} from '../../support/postgres-container';

describe('TypeOrmRefreshTokenRepository (integration)', () => {
  let pg: PostgresHandle;
  let repo: TypeOrmRefreshTokenRepository;
  let userId: string;

  beforeAll(async () => {
    pg = await setupPostgres();
    repo = new TypeOrmRefreshTokenRepository(pg.dataSource.getRepository(RefreshTokenOrmEntity));
  }, 60_000);

  afterAll(async () => {
    await teardownPostgres(pg);
  });

  beforeEach(async () => {
    await truncateAll(pg.dataSource, ['refresh_tokens', 'users']);
    const user = Object.assign(new UserOrmEntity(), {
      id: uuidv7(),
      email: 'rt@bd.test',
      nickname: 'refreshtester',
      passwordHash: 'h',
      role: 'user',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await pg.dataSource.getRepository(UserOrmEntity).save(user);
    userId = user.id;
  });

  function token(overrides: Partial<{ tokenHash: string; expiresAt: Date }> = {}): RefreshToken {
    return RefreshToken.issue({
      id: uuidv7(),
      userId,
      tokenHash: overrides.tokenHash ?? 'hash-' + Math.random(),
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }

  it('save + findById round-trip preserves revocation state', async () => {
    const t = token();
    await repo.save(t);

    const found = await repo.findById(t.id);
    expect(found).not.toBeNull();
    expect(found!.isRevoked).toBe(false);

    found!.revoke(uuidv7());
    await repo.save(found!);

    const reread = await repo.findById(t.id);
    expect(reread!.isRevoked).toBe(true);
  });

  it('revokeAllForUser only affects unrevoked tokens', async () => {
    const t1 = token({ tokenHash: 'h1' });
    const t2 = token({ tokenHash: 'h2' });
    await repo.save(t1);
    await repo.save(t2);

    // Pre-revoke t2; revokedAt should not be overwritten by revokeAllForUser
    t2.revoke();
    await repo.save(t2);
    const t2RevokedAtBefore = t2.toSnapshot().revokedAt;

    await repo.revokeAllForUser(userId);

    const after1 = (await repo.findById(t1.id))!;
    const after2 = (await repo.findById(t2.id))!;
    expect(after1.isRevoked).toBe(true);
    expect(after2.isRevoked).toBe(true);
    // The original revoked_at on t2 should not have been touched.
    expect(after2.toSnapshot().revokedAt!.getTime()).toBe(t2RevokedAtBefore!.getTime());
  });

  it('deleteExpired removes only past-due rows', async () => {
    const expired = token({ expiresAt: new Date(Date.now() - 1000) });
    const live = token({ expiresAt: new Date(Date.now() + 60_000) });
    await repo.save(expired);
    await repo.save(live);

    const removed = await repo.deleteExpired();
    expect(removed).toBe(1);

    expect(await repo.findById(expired.id)).toBeNull();
    expect(await repo.findById(live.id)).not.toBeNull();
  });
});
