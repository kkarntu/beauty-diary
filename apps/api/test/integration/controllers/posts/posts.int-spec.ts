import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from '../../support/app-factory';

describe('Posts + comments (integration)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const ds = app.get(DataSource);
    await ds.query(
      'TRUNCATE TABLE "comments", "post_tags", "tags", "posts", "password_reset_tokens", "refresh_tokens", "users" RESTART IDENTITY CASCADE',
    );
  });

  async function registerUser(email: string, nickname: string): Promise<string[]> {
    await request(server)
      .post('/api/auth/register')
      .send({ email, password: 'SecurePass123', nickname })
      .expect(201);
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'SecurePass123' })
      .expect(200);
    return login.headers['set-cookie'] as unknown as string[];
  }

  async function getCategoryId(): Promise<string> {
    const res = await request(server).get('/api/categories').expect(200);
    return res.body[0].id as string;
  }

  it('creates a post and exposes it via slug + list + comments', async () => {
    const cookies = await registerUser('author@bd.test', 'author1');
    const categoryId = await getCategoryId();

    const created = await request(server)
      .post('/api/posts')
      .set('Cookie', cookies)
      .send({
        title: 'Зимовий догляд за шкірою',
        contentHtml: '<h1>Hello</h1><p>This is a longer test post about winter skincare.</p>',
        categoryId,
        tagSlugs: ['winter', 'skincare'],
        excerpt: 'Tips for winter skincare',
        status: 'published',
      })
      .expect(201);

    expect(created.body.slug).toMatch(/^[a-z0-9-]+$/);

    const detail = await request(server).get(`/api/posts/${created.body.slug}`).expect(200);
    expect(detail.body.title).toBe('Зимовий догляд за шкірою');
    expect(detail.body.author.nickname).toBe('author1');
    expect(detail.body.tags.map((t: { slug: string }) => t.slug).sort()).toEqual([
      'skincare',
      'winter',
    ]);

    const list = await request(server).get('/api/posts?page=1&pageSize=10').expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].slug).toBe(created.body.slug);

    const filtered = await request(server)
      .get('/api/posts?page=1&pageSize=10&tagSlug=winter')
      .expect(200);
    expect(filtered.body.total).toBe(1);

    const noMatch = await request(server)
      .get('/api/posts?page=1&pageSize=10&tagSlug=nonexistent')
      .expect(200);
    expect(noMatch.body.total).toBe(0);
  });

  it('does not list draft posts publicly and 404s on slug fetch', async () => {
    const cookies = await registerUser('author2@bd.test', 'author2');
    const categoryId = await getCategoryId();

    const created = await request(server)
      .post('/api/posts')
      .set('Cookie', cookies)
      .send({
        title: 'Draft only',
        contentHtml: '<p>still working on this</p>',
        categoryId,
        tagSlugs: [],
        status: 'draft',
      })
      .expect(201);

    const list = await request(server).get('/api/posts').expect(200);
    expect(list.body.total).toBe(0);

    await request(server).get(`/api/posts/${created.body.slug}`).expect(404);
  });

  it('rejects unauthenticated post creation', async () => {
    const categoryId = await getCategoryId();
    await request(server)
      .post('/api/posts')
      .send({
        title: 'Anonymous attempt',
        contentHtml: '<p>should fail</p>',
        categoryId,
        tagSlugs: [],
        status: 'published',
      })
      .expect(401);
  });

  it('threads comments with one-level replies', async () => {
    const authorCookies = await registerUser('author3@bd.test', 'author3');
    const reader1Cookies = await registerUser('reader1@bd.test', 'reader1');
    const reader2Cookies = await registerUser('reader2@bd.test', 'reader2');
    const categoryId = await getCategoryId();

    const post = await request(server)
      .post('/api/posts')
      .set('Cookie', authorCookies)
      .send({
        title: 'A discussable post',
        contentHtml: '<p>lots to discuss</p>',
        categoryId,
        tagSlugs: [],
        status: 'published',
      })
      .expect(201);

    const top = await request(server)
      .post(`/api/posts/${post.body.id}/comments`)
      .set('Cookie', reader1Cookies)
      .send({ content: 'Great post!' })
      .expect(201);

    await request(server)
      .post(`/api/posts/${post.body.id}/comments`)
      .set('Cookie', reader2Cookies)
      .send({ content: 'Agreed.', parentId: top.body.id })
      .expect(201);

    // Replies to replies are rejected
    const reply = (
      await request(server)
        .post(`/api/posts/${post.body.id}/comments`)
        .set('Cookie', reader2Cookies)
        .send({ content: 'Agreed.', parentId: top.body.id })
        .expect(201)
    ).body;
    await request(server)
      .post(`/api/posts/${post.body.id}/comments`)
      .set('Cookie', reader1Cookies)
      .send({ content: 'no nesting', parentId: reply.id })
      .expect(400);

    const list = await request(server)
      .get(`/api/posts/${post.body.id}/comments`)
      .expect(200);
    expect(list.body).toHaveLength(3);
    expect(list.body.filter((c: { parentId: string | null }) => c.parentId === null)).toHaveLength(1);

    // commentsCount on the post should reflect the saved comments
    const detail = await request(server).get(`/api/posts/${post.body.slug}`).expect(200);
    expect(detail.body.commentsCount).toBe(3);
  });
});
