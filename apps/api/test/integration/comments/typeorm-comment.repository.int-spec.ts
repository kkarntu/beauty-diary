import { v7 as uuidv7 } from 'uuid';
import { Comment } from '../../../src/modules/comments/domain/comment.entity';
import { CommentOrmEntity } from '../../../src/modules/comments/infrastructure/persistence/comment.orm-entity';
import { TypeOrmCommentRepository } from '../../../src/modules/comments/infrastructure/persistence/typeorm-comment.repository';
import { CategoryOrmEntity } from '../../../src/modules/categories/infrastructure/persistence/category.orm-entity';
import { UserOrmEntity } from '../../../src/modules/users/infrastructure/persistence/user.orm-entity';
import {
  type PostgresHandle,
  setupPostgres,
  teardownPostgres,
  truncateAll,
} from '../../support/postgres-container';

describe('TypeOrmCommentRepository (integration)', () => {
  let pg: PostgresHandle;
  let repo: TypeOrmCommentRepository;
  let authorId: string;
  let postId: string;

  beforeAll(async () => {
    pg = await setupPostgres();
    repo = new TypeOrmCommentRepository(pg.dataSource.getRepository(CommentOrmEntity));
  }, 60_000);

  afterAll(async () => {
    await teardownPostgres(pg);
  });

  beforeEach(async () => {
    await truncateAll(pg.dataSource, [
      'comments',
      'post_tags',
      'tags',
      'posts',
      'users',
    ]);

    const user = Object.assign(new UserOrmEntity(), {
      id: uuidv7(),
      email: 'c@bd.test',
      nickname: 'commenttester',
      passwordHash: 'h',
      role: 'user',
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await pg.dataSource.getRepository(UserOrmEntity).save(user);
    authorId = user.id;

    const [cat] = (await pg.dataSource
      .getRepository(CategoryOrmEntity)
      .find({ take: 1 })) as CategoryOrmEntity[];
    if (!cat) throw new Error('Categories not seeded');
    postId = uuidv7();
    await pg.dataSource.query(
      `INSERT INTO posts (id, author_id, category_id, slug, title, content_html, status, published_at, reading_minutes, views_count, likes_count, comments_count, created_at, updated_at)
       VALUES ($1, $2, $3, 'commented', 'P', '<p>x</p>', 'published', now(), 1, 0, 0, 0, now(), now())`,
      [postId, authorId, cat.id],
    );
  });

  function newComment(parentId: string | null = null, content = 'hello'): Comment {
    return Comment.create({
      id: uuidv7(),
      postId,
      authorId,
      parentId,
      content,
    });
  }

  it('save + findById round-trip', async () => {
    const c = newComment();
    await repo.save(c);
    const found = await repo.findById(c.id);
    expect(found).not.toBeNull();
    expect(found!.postId).toBe(postId);
  });

  it('listByPostId orders ascending and includes author info', async () => {
    const a = newComment(null, 'first');
    await repo.save(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = newComment(null, 'second');
    await repo.save(b);

    const list = await repo.listByPostId(postId);
    expect(list).toHaveLength(2);
    expect(list[0]!.content).toBe('first');
    expect(list[1]!.content).toBe('second');
    expect(list[0]!.author.nickname).toBe('commenttester');
  });

  it('soft-deleted comments render as [deleted] in the list', async () => {
    const c = newComment(null, 'will be deleted');
    await repo.save(c);
    c.softDelete();
    await repo.save(c);

    const list = await repo.listByPostId(postId);
    expect(list[0]!.content).toBe('[deleted]');
  });

  it('preserves parent_id for replies', async () => {
    const top = newComment(null, 'top');
    await repo.save(top);
    const reply = newComment(top.id, 'reply');
    await repo.save(reply);

    const list = await repo.listByPostId(postId);
    expect(list).toHaveLength(2);
    const replyRow = list.find((c) => c.parentId === top.id);
    expect(replyRow).toBeDefined();
    expect(replyRow!.content).toBe('reply');
  });
});
