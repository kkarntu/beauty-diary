import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from '../../../support/app-factory';

describe('Reactions (likes + favorites) (integration)', () => {
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
      'TRUNCATE TABLE "post_likes", "post_favorites", "comments", "post_tags", "tags", "posts", "password_reset_tokens", "refresh_tokens", "users" RESTART IDENTITY CASCADE',
    );
  });

  async function login(email: string, nickname: string): Promise<string[]> {
    await request(server)
      .post('/api/auth/register')
      .send({ email, password: 'SecurePass123', nickname })
      .expect(201);
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'SecurePass123' })
      .expect(200);
    return res.headers['set-cookie'] as unknown as string[];
  }

  async function createPublishedPost(cookies: string[]): Promise<{ id: string; slug: string }> {
    const cat = (await request(server).get('/api/categories').expect(200)).body[0];
    const res = await request(server)
      .post('/api/posts')
      .set('Cookie', cookies)
      .send({
        title: 'A likeable post',
        contentHtml: '<p>body</p>',
        categoryId: cat.id,
        tagSlugs: [],
        status: 'published',
      })
      .expect(201);
    return res.body;
  }

  describe('like / unlike', () => {
    it('toggles like, syncs counter via trigger, exposes flag for current user', async () => {
      const authorCookies = await login('a@bd.test', 'authoruser');
      const readerCookies = await login('r@bd.test', 'readeruser');
      const post = await createPublishedPost(authorCookies);

      // Like
      await request(server)
        .put(`/api/posts/${post.id}/like`)
        .set('Cookie', readerCookies)
        .expect(204);

      let detail = await request(server)
        .get(`/api/posts/${post.slug}`)
        .set('Cookie', readerCookies)
        .expect(200);
      expect(detail.body.likesCount).toBe(1);
      expect(detail.body.isLikedByMe).toBe(true);

      // Anonymous viewer should see the count but not the personalised flag
      detail = await request(server).get(`/api/posts/${post.slug}`).expect(200);
      expect(detail.body.likesCount).toBe(1);
      expect(detail.body.isLikedByMe).toBe(false);

      // Liking again is a no-op (idempotent)
      await request(server)
        .put(`/api/posts/${post.id}/like`)
        .set('Cookie', readerCookies)
        .expect(204);
      detail = await request(server).get(`/api/posts/${post.slug}`).expect(200);
      expect(detail.body.likesCount).toBe(1);

      // Unlike
      await request(server)
        .delete(`/api/posts/${post.id}/like`)
        .set('Cookie', readerCookies)
        .expect(204);
      detail = await request(server)
        .get(`/api/posts/${post.slug}`)
        .set('Cookie', readerCookies)
        .expect(200);
      expect(detail.body.likesCount).toBe(0);
      expect(detail.body.isLikedByMe).toBe(false);

      // Unlike again is a no-op
      await request(server)
        .delete(`/api/posts/${post.id}/like`)
        .set('Cookie', readerCookies)
        .expect(204);
    });

    it('rejects liking unpublished post', async () => {
      const authorCookies = await login('a@bd.test', 'authoruser');
      const readerCookies = await login('r@bd.test', 'readeruser');
      const cat = (await request(server).get('/api/categories').expect(200)).body[0];
      const draft = (
        await request(server)
          .post('/api/posts')
          .set('Cookie', authorCookies)
          .send({
            title: 'Draft',
            contentHtml: '<p>body</p>',
            categoryId: cat.id,
            tagSlugs: [],
            status: 'draft',
          })
          .expect(201)
      ).body;

      await request(server)
        .put(`/api/posts/${draft.id}/like`)
        .set('Cookie', readerCookies)
        .expect(404);
    });

    it('requires auth', async () => {
      const authorCookies = await login('a@bd.test', 'authoruser');
      const post = await createPublishedPost(authorCookies);
      await request(server).put(`/api/posts/${post.id}/like`).expect(401);
      await request(server).delete(`/api/posts/${post.id}/like`).expect(401);
    });
  });

  describe('favorite / unfavorite + /me/favorites', () => {
    it('favorites a post and lists it under /me/favorites', async () => {
      const authorCookies = await login('a@bd.test', 'authoruser');
      const readerCookies = await login('r@bd.test', 'readeruser');
      const post = await createPublishedPost(authorCookies);

      await request(server)
        .put(`/api/posts/${post.id}/favorite`)
        .set('Cookie', readerCookies)
        .expect(204);

      const detail = await request(server)
        .get(`/api/posts/${post.slug}`)
        .set('Cookie', readerCookies)
        .expect(200);
      expect(detail.body.isFavoritedByMe).toBe(true);

      const list = await request(server)
        .get('/api/me/favorites?page=1&pageSize=20')
        .set('Cookie', readerCookies)
        .expect(200);
      expect(list.body.total).toBe(1);
      expect(list.body.items[0].id).toBe(post.id);

      await request(server)
        .delete(`/api/posts/${post.id}/favorite`)
        .set('Cookie', readerCookies)
        .expect(204);
      const list2 = await request(server)
        .get('/api/me/favorites')
        .set('Cookie', readerCookies)
        .expect(200);
      expect(list2.body.total).toBe(0);
    });

    it('only the favoriting user sees it in their /me/favorites', async () => {
      const authorCookies = await login('a@bd.test', 'authoruser');
      const readerCookies = await login('r@bd.test', 'readeruser');
      const otherCookies = await login('o@bd.test', 'otheruser');
      const post = await createPublishedPost(authorCookies);

      await request(server)
        .put(`/api/posts/${post.id}/favorite`)
        .set('Cookie', readerCookies)
        .expect(204);

      const ownerList = await request(server)
        .get('/api/me/favorites')
        .set('Cookie', readerCookies)
        .expect(200);
      expect(ownerList.body.total).toBe(1);

      const otherList = await request(server)
        .get('/api/me/favorites')
        .set('Cookie', otherCookies)
        .expect(200);
      expect(otherList.body.total).toBe(0);
    });

    it('requires auth on /me/favorites', async () => {
      await request(server).get('/api/me/favorites').expect(401);
    });
  });

  describe('isLikedByMe / isFavoritedByMe in feed', () => {
    it('exposes flags per row when listing posts as authenticated user', async () => {
      const authorCookies = await login('a@bd.test', 'authoruser');
      const readerCookies = await login('r@bd.test', 'readeruser');
      const post = await createPublishedPost(authorCookies);

      await request(server)
        .put(`/api/posts/${post.id}/like`)
        .set('Cookie', readerCookies)
        .expect(204);
      await request(server)
        .put(`/api/posts/${post.id}/favorite`)
        .set('Cookie', readerCookies)
        .expect(204);

      const list = await request(server).get('/api/posts').set('Cookie', readerCookies).expect(200);
      expect(list.body.items[0].isLikedByMe).toBe(true);
      expect(list.body.items[0].isFavoritedByMe).toBe(true);

      // Author hasn't liked their own post
      const list2 = await request(server)
        .get('/api/posts')
        .set('Cookie', authorCookies)
        .expect(200);
      expect(list2.body.items[0].isLikedByMe).toBe(false);
      expect(list2.body.items[0].isFavoritedByMe).toBe(false);
    });
  });
});
