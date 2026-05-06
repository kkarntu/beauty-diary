import { v7 as uuidv7 } from 'uuid';
import { TypeOrmReactionRepository } from '../../../src/modules/reactions/infrastructure/persistence/typeorm-reaction.repository';
import { CategoryOrmEntity } from '../../../src/modules/categories/infrastructure/persistence/category.orm-entity';
import { UserOrmEntity } from '../../../src/modules/users/infrastructure/persistence/user.orm-entity';
import {
  type PostgresHandle,
  setupPostgres,
  teardownPostgres,
  truncateAll,
} from '../../support/postgres-container';

describe('TypeOrmReactionRepository (integration)', () => {
  let pg: PostgresHandle;
  let repo: TypeOrmReactionRepository;
  let userId: string;
  let postId: string;

  beforeAll(async () => {
    pg = await setupPostgres();
    repo = new TypeOrmReactionRepository(pg.dataSource);
  }, 60_000);

  afterAll(async () => {
    await teardownPostgres(pg);
  });

  beforeEach(async () => {
    await truncateAll(pg.dataSource, [
      'post_likes',
      'post_favorites',
      'post_tags',
      'comments',
      'posts',
      'users',
    ]);

    const user = Object.assign(new UserOrmEntity(), {
      id: uuidv7(),
      email: 'r@bd.test',
      nickname: 'reactiontester',
      passwordHash: 'h',
      role: 'user',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await pg.dataSource.getRepository(UserOrmEntity).save(user);
    userId = user.id;

    const [cat] = (await pg.dataSource
      .getRepository(CategoryOrmEntity)
      .find({ take: 1 })) as CategoryOrmEntity[];
    if (!cat) throw new Error('Categories not seeded');

    postId = uuidv7();
    await pg.dataSource.query(
      `INSERT INTO posts (id, author_id, category_id, slug, title, content_html, status, published_at, reading_minutes, views_count, likes_count, comments_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'P', '<p>x</p>', 'published', now(), 1, 0, 0, 0, now(), now())`,
      [postId, userId, cat.id, 'p-' + postId.slice(0, 6)],
    );
  });

  describe('like / unlike (verifies trigger keeps likes_count in sync)', () => {
    async function postLikesCount(): Promise<number> {
      const rows = (await pg.dataSource.query(
        `SELECT likes_count::int AS likes_count FROM posts WHERE id = $1`,
        [postId],
      )) as Array<{ likes_count: number }>;
      const row = rows[0];
      if (!row) throw new Error(`Post ${postId} not found`);
      return row.likes_count;
    }

    it('first like inserts and trigger increments counter', async () => {
      const inserted = await repo.like(userId, postId);
      expect(inserted).toBe(true);
      expect(await postLikesCount()).toBe(1);
    });

    it('second like is a no-op (idempotent), counter stays at 1', async () => {
      await repo.like(userId, postId);
      const second = await repo.like(userId, postId);
      expect(second).toBe(false);
      expect(await postLikesCount()).toBe(1);
    });

    it('unlike removes the row and trigger decrements counter', async () => {
      await repo.like(userId, postId);
      const removed = await repo.unlike(userId, postId);
      expect(removed).toBe(true);
      expect(await postLikesCount()).toBe(0);
    });

    it('unlike when not liked is a no-op', async () => {
      const removed = await repo.unlike(userId, postId);
      expect(removed).toBe(false);
      expect(await postLikesCount()).toBe(0);
    });
  });

  describe('favorite / unfavorite + listFavoritesByUser', () => {
    it('favorites round-trip through the listing query', async () => {
      const inserted = await repo.favorite(userId, postId);
      expect(inserted).toBe(true);

      const list = await repo.listFavoritesByUser({ userId, page: 1, pageSize: 20 });
      expect(list.total).toBe(1);
      expect(list.items[0]!.id).toBe(postId);
      expect(list.items[0]!.isLikedByMe).toBe(false);

      // Like it too — listing should reflect that join
      await repo.like(userId, postId);
      const withLike = await repo.listFavoritesByUser({ userId, page: 1, pageSize: 20 });
      expect(withLike.items[0]!.isLikedByMe).toBe(true);
    });

    it('unfavorite removes from list', async () => {
      await repo.favorite(userId, postId);
      await repo.unfavorite(userId, postId);
      const list = await repo.listFavoritesByUser({ userId, page: 1, pageSize: 20 });
      expect(list.total).toBe(0);
    });

    it("does not surface another user's favorites", async () => {
      const otherUser = Object.assign(new UserOrmEntity(), {
        id: uuidv7(),
        email: 'o@bd.test',
        nickname: 'otherperson',
        passwordHash: 'h',
        role: 'user',
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await pg.dataSource.getRepository(UserOrmEntity).save(otherUser);

      await repo.favorite(otherUser.id, postId);

      const list = await repo.listFavoritesByUser({ userId, page: 1, pageSize: 20 });
      expect(list.total).toBe(0);
    });
  });
});
