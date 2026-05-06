import { v7 as uuidv7 } from 'uuid';
import { AuditLogEntry } from '../../../src/modules/admin/domain/audit-log.entity';
import { AuditLogOrmEntity } from '../../../src/modules/admin/infrastructure/persistence/audit-log.orm-entity';
import { TypeOrmAuditLogRepository } from '../../../src/modules/admin/infrastructure/persistence/typeorm-audit-log.repository';
import { UserOrmEntity } from '../../../src/modules/users/infrastructure/persistence/user.orm-entity';
import {
  type PostgresHandle,
  setupPostgres,
  teardownPostgres,
  truncateAll,
} from '../../support/postgres-container';

describe('TypeOrmAuditLogRepository (integration)', () => {
  let pg: PostgresHandle;
  let repo: TypeOrmAuditLogRepository;
  let actorId: string;

  beforeAll(async () => {
    pg = await setupPostgres();
    repo = new TypeOrmAuditLogRepository(
      pg.dataSource.getRepository(AuditLogOrmEntity),
      pg.dataSource,
    );
  }, 60_000);

  afterAll(async () => {
    await teardownPostgres(pg);
  });

  beforeEach(async () => {
    await truncateAll(pg.dataSource, ['audit_logs', 'users']);
    const actor = Object.assign(new UserOrmEntity(), {
      id: uuidv7(),
      email: 'admin@bd.test',
      nickname: 'adminactor',
      passwordHash: 'h',
      role: 'admin',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await pg.dataSource.getRepository(UserOrmEntity).save(actor);
    actorId = actor.id;
  });

  function entry(action: string, metadata: Record<string, unknown> = {}): AuditLogEntry {
    return AuditLogEntry.create({
      id: uuidv7(),
      actorId,
      action,
      targetType: 'user',
      targetId: uuidv7(),
      metadata,
    });
  }

  it('save persists JSONB metadata', async () => {
    await repo.save(entry('user.state_changed', { isBlockedTo: true }));
    const { items } = await repo.list({ page: 1, pageSize: 10 });
    expect(items).toHaveLength(1);
    expect(items[0]!.metadata).toEqual({ isBlockedTo: true });
  });

  it('list orders by created_at desc and joins actor nickname', async () => {
    await repo.save(entry('a', { i: 1 }));
    await new Promise((r) => setTimeout(r, 5));
    await repo.save(entry('b', { i: 2 }));

    const { items, total } = await repo.list({ page: 1, pageSize: 10 });
    expect(total).toBe(2);
    expect(items[0]!.action).toBe('b'); // most recent first
    expect(items[0]!.actorNickname).toBe('adminactor');
  });

  it('filters by action and targetType', async () => {
    await repo.save(entry('user.state_changed'));
    await repo.save(entry('user.role_changed'));
    await repo.save(entry('post.deleted'));

    const stateChanges = await repo.list({
      page: 1,
      pageSize: 10,
      action: 'user.state_changed',
    });
    expect(stateChanges.total).toBe(1);

    const userTargets = await repo.list({ page: 1, pageSize: 10, targetType: 'user' });
    expect(userTargets.total).toBe(3);
  });

  it('paginates correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.save(entry('seed', { i }));
    }
    const page1 = await repo.list({ page: 1, pageSize: 2 });
    const page2 = await repo.list({ page: 2, pageSize: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.items[0]!.id).not.toBe(page2.items[0]!.id);
  });
});
