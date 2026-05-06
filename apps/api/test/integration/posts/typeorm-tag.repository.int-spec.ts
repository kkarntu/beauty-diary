import { TagOrmEntity } from '../../../src/modules/posts/infrastructure/persistence/tag.orm-entity';
import { TypeOrmTagRepository } from '../../../src/modules/posts/infrastructure/persistence/typeorm-tag.repository';
import {
  type PostgresHandle,
  setupPostgres,
  teardownPostgres,
  truncateAll,
} from '../../support/postgres-container';

describe('TypeOrmTagRepository (integration)', () => {
  let pg: PostgresHandle;
  let repo: TypeOrmTagRepository;

  beforeAll(async () => {
    pg = await setupPostgres();
    repo = new TypeOrmTagRepository(pg.dataSource.getRepository(TagOrmEntity));
  }, 60_000);

  afterAll(async () => {
    await teardownPostgres(pg);
  });

  beforeEach(async () => {
    await truncateAll(pg.dataSource, ['post_tags', 'tags']);
  });

  it('findOrCreateMany inserts new slugs and returns all matches', async () => {
    const tags = await repo.findOrCreateMany(['skincare', 'makeup', 'fashion']);
    expect(tags).toHaveLength(3);
    const slugs = tags.map((t) => t.slug).sort();
    expect(slugs).toEqual(['fashion', 'makeup', 'skincare']);
  });

  it('idempotent on repeat: existing rows are reused, no duplicates inserted', async () => {
    await repo.findOrCreateMany(['hair', 'wellness']);
    const second = await repo.findOrCreateMany(['hair', 'lifestyle']);
    expect(second).toHaveLength(2);

    const total = (await pg.dataSource.query(`SELECT count(*)::int AS n FROM tags`)) as Array<{
      n: number;
    }>;
    expect(total[0]!.n).toBe(3); // hair, wellness, lifestyle
  });

  it('normalizes slugs (slugifyTag): trims, lowercases, replaces spaces', async () => {
    const tags = await repo.findOrCreateMany(['Bold Glam', 'BOLD GLAM']);
    expect(tags).toHaveLength(1);
    expect(tags[0]!.slug).toBe('bold-glam');
  });

  it('findBySlug returns null for unknown slug', async () => {
    expect(await repo.findBySlug('nonexistent')).toBeNull();
  });

  it('findBySlug returns the row for an existing slug (case-insensitive via citext)', async () => {
    await repo.findOrCreateMany(['vintage']);
    const found = await repo.findBySlug('VINTAGE');
    expect(found).not.toBeNull();
    expect(found!.slug).toBe('vintage');
  });
});
