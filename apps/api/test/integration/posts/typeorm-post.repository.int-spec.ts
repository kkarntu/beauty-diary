import { v7 as uuidv7 } from 'uuid';
import { Post } from '../../../src/modules/posts/domain/post.entity';
import { PostOrmEntity } from '../../../src/modules/posts/infrastructure/persistence/post.orm-entity';
import { PostTagOrmEntity } from '../../../src/modules/posts/infrastructure/persistence/post-tag.orm-entity';
import { TagOrmEntity } from '../../../src/modules/posts/infrastructure/persistence/tag.orm-entity';
import { TypeOrmPostRepository } from '../../../src/modules/posts/infrastructure/persistence/typeorm-post.repository';
import { CategoryOrmEntity } from '../../../src/modules/categories/infrastructure/persistence/category.orm-entity';
import { UserOrmEntity } from '../../../src/modules/users/infrastructure/persistence/user.orm-entity';
import {
  type PostgresHandle,
  setupPostgres,
  teardownPostgres,
  truncateAll,
} from '../../support/postgres-container';

describe('TypeOrmPostRepository (integration)', () => {
  let pg: PostgresHandle;
  let repo: TypeOrmPostRepository;

  let categoryId: string;
  let authorId: string;

  beforeAll(async () => {
    pg = await setupPostgres();
    repo = new TypeOrmPostRepository(
      pg.dataSource.getRepository(PostOrmEntity),
      pg.dataSource.getRepository(PostTagOrmEntity),
    );
  }, 60_000);

  afterAll(async () => {
    await teardownPostgres(pg);
  });

  beforeEach(async () => {
    await truncateAll(pg.dataSource, [
      'post_tags',
      'tags',
      'comments',
      'posts',
      'users',
    ]);

    // Categories are seeded by migration; pick one.
    const [cat] = (await pg.dataSource
      .getRepository(CategoryOrmEntity)
      .find({ take: 1 })) as CategoryOrmEntity[];
    if (!cat) throw new Error('Categories not seeded — did the migration run?');
    categoryId = cat.id;

    // Author user
    const author = new UserOrmEntity();
    author.id = uuidv7();
    author.email = 'author@bd.test';
    author.nickname = 'authoruser';
    author.passwordHash = 'h';
    author.role = 'user';
    author.displayName = null;
    author.avatarUrl = null;
    author.bio = null;
    author.isBlocked = false;
    author.emailVerifiedAt = null;
    author.createdAt = new Date();
    author.updatedAt = new Date();
    await pg.dataSource.getRepository(UserOrmEntity).save(author);
    authorId = author.id;
  });

  function makePost(overrides: { slug?: string; status?: 'draft' | 'published' } = {}): Post {
    return Post.create({
      id: uuidv7(),
      authorId,
      categoryId,
      // UUIDv7's leading bits are timestamp-derived, so short slices collide
      // when several posts are saved in the same millisecond. Use the full UUID.
      slug: overrides.slug ?? 'post-' + uuidv7(),
      title: 'A post',
      excerpt: null,
      contentHtml: '<p>body</p>',
      coverImageUrl: null,
      status: overrides.status ?? 'published',
    });
  }

  it('save + findBySlug round-trip', async () => {
    const post = makePost({ slug: 'unique-slug' });
    await repo.save(post);
    const found = await repo.findBySlug('unique-slug');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(post.id);
  });

  it('list returns only published posts', async () => {
    await repo.save(makePost({ status: 'published' }));
    await repo.save(makePost({ status: 'draft' }));
    await repo.save(makePost({ status: 'published' }));

    const { items, total } = await repo.list({ page: 1, pageSize: 20, sort: 'recent' });
    expect(total).toBe(2);
    expect(items.every((i) => i.status === 'published')).toBe(true);
  });

  it('list filters by category slug', async () => {
    const cats = (await pg.dataSource
      .getRepository(CategoryOrmEntity)
      .find({ order: { sortOrder: 'ASC' }, take: 2 })) as CategoryOrmEntity[];
    const skincare = cats[0];
    const makeup = cats[1];
    if (!skincare || !makeup) throw new Error('Expected at least 2 seeded categories');

    await pg.dataSource.query(
      `INSERT INTO posts (id, author_id, category_id, slug, title, content_html, status, published_at, reading_minutes, views_count, likes_count, comments_count, created_at, updated_at)
       VALUES ($1, $2, $3, 'skin-1', 'x', '<p>x</p>', 'published', now(), 1, 0, 0, 0, now(), now())`,
      [uuidv7(), authorId, skincare.id],
    );
    await pg.dataSource.query(
      `INSERT INTO posts (id, author_id, category_id, slug, title, content_html, status, published_at, reading_minutes, views_count, likes_count, comments_count, created_at, updated_at)
       VALUES ($1, $2, $3, 'makeup-1', 'y', '<p>y</p>', 'published', now(), 1, 0, 0, 0, now(), now())`,
      [uuidv7(), authorId, makeup.id],
    );

    const { total } = await repo.list({
      page: 1,
      pageSize: 20,
      sort: 'recent',
      categorySlug: skincare.slug,
    });
    expect(total).toBe(1);
  });

  it('list filters by tag slug via post_tags join', async () => {
    const tagRepo = pg.dataSource.getRepository(TagOrmEntity);
    const winterTag = new TagOrmEntity();
    winterTag.id = uuidv7();
    winterTag.slug = 'winter';
    winterTag.name = 'winter';
    await tagRepo.save(winterTag);

    const taggedPost = makePost({ slug: 'tagged' });
    await repo.save(taggedPost);
    await repo.attachTags(taggedPost.id, [winterTag.id]);

    const untagged = makePost({ slug: 'untagged' });
    await repo.save(untagged);

    const { items, total } = await repo.list({
      page: 1,
      pageSize: 20,
      sort: 'recent',
      tagSlug: 'winter',
    });
    expect(total).toBe(1);
    expect(items[0]!.slug).toBe('tagged');
  });

  it('detailBySlug includes tags + reaction flags when currentUserId is provided', async () => {
    const tagRepo = pg.dataSource.getRepository(TagOrmEntity);
    const tag = new TagOrmEntity();
    tag.id = uuidv7();
    tag.slug = 'beauty';
    tag.name = 'beauty';
    await tagRepo.save(tag);

    const post = makePost({ slug: 'detail-slug' });
    await repo.save(post);
    await repo.attachTags(post.id, [tag.id]);

    // Anonymous viewer
    const anon = await repo.detailBySlug('detail-slug');
    expect(anon).not.toBeNull();
    expect(anon!.isLikedByMe).toBe(false);
    expect(anon!.tags).toEqual([{ slug: 'beauty', name: 'beauty' }]);

    // Authenticated viewer who has liked it
    await pg.dataSource.query(`INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)`, [
      authorId,
      post.id,
    ]);

    const authed = await repo.detailBySlug('detail-slug', authorId);
    expect(authed!.isLikedByMe).toBe(true);
  });

  it('detachAllTags + attachTags swaps the tag set', async () => {
    const tagRepo = pg.dataSource.getRepository(TagOrmEntity);
    const t1 = Object.assign(new TagOrmEntity(), {
      id: uuidv7(),
      slug: 'old',
      name: 'old',
    });
    const t2 = Object.assign(new TagOrmEntity(), {
      id: uuidv7(),
      slug: 'new',
      name: 'new',
    });
    await tagRepo.save([t1, t2]);

    const post = makePost({ slug: 'swap-tags' });
    await repo.save(post);
    await repo.attachTags(post.id, [t1.id]);

    let detail = await repo.detailBySlug('swap-tags');
    expect(detail!.tags.map((t) => t.slug)).toEqual(['old']);

    await repo.detachAllTags(post.id);
    await repo.attachTags(post.id, [t2.id]);

    detail = await repo.detailBySlug('swap-tags');
    expect(detail!.tags.map((t) => t.slug)).toEqual(['new']);
  });

  it('delete cascades and removes the post', async () => {
    const post = makePost({ slug: 'doomed' });
    await repo.save(post);
    await repo.delete(post.id);
    expect(await repo.findBySlug('doomed')).toBeNull();
  });
});
