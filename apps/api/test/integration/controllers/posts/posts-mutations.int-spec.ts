import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from '../../../support/app-factory';

/**
 * Covers ownership-protected mutations: PATCH/DELETE/publish/archive on posts,
 * PATCH/DELETE on comments. Verifies a non-author cannot modify someone
 * else's content, and an admin can.
 */
describe('Posts + comments mutations (integration)', () => {
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

  async function registerAndLogin(email: string, nickname: string): Promise<string[]> {
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

  async function promoteToAdmin(nickname: string): Promise<void> {
    const ds = app.get(DataSource);
    await ds.query(`UPDATE users SET role = 'admin' WHERE nickname = $1`, [nickname]);
  }

  async function getCategoryId(): Promise<string> {
    const res = await request(server).get('/api/categories').expect(200);
    return res.body[0].id as string;
  }

  async function createPost(
    cookies: string[],
    overrides: Partial<{ title: string; status: 'draft' | 'published'; tagSlugs: string[] }> = {},
  ): Promise<{ id: string; slug: string }> {
    const categoryId = await getCategoryId();
    const res = await request(server)
      .post('/api/posts')
      .set('Cookie', cookies)
      .send({
        title: overrides.title ?? 'Original title',
        contentHtml: '<p>original body</p>',
        categoryId,
        tagSlugs: overrides.tagSlugs ?? ['original'],
        status: overrides.status ?? 'published',
      })
      .expect(201);
    return res.body;
  }

  describe('PATCH /api/posts/:id', () => {
    it('lets the author update title, content, and tags', async () => {
      const cookies = await registerAndLogin('author@bd.test', 'author');
      const post = await createPost(cookies);

      await request(server)
        .patch(`/api/posts/${post.id}`)
        .set('Cookie', cookies)
        .send({ title: 'Updated title', contentHtml: '<p>fresh body</p>', tagSlugs: ['updated'] })
        .expect(204);

      const detail = await request(server).get(`/api/posts/${post.slug}`).expect(200);
      expect(detail.body.title).toBe('Updated title');
      expect(detail.body.contentHtml).toBe('<p>fresh body</p>');
      expect(detail.body.tags.map((t: { slug: string }) => t.slug)).toEqual(['updated']);
    });

    it('rejects edits from another user (403)', async () => {
      const ownerCookies = await registerAndLogin('o@bd.test', 'owner');
      const otherCookies = await registerAndLogin('x@bd.test', 'attacker');
      const post = await createPost(ownerCookies);

      await request(server)
        .patch(`/api/posts/${post.id}`)
        .set('Cookie', otherCookies)
        .send({ title: 'hacked' })
        .expect(403);
    });

    it('rejects unauthenticated edits (401)', async () => {
      const ownerCookies = await registerAndLogin('o@bd.test', 'owner');
      const post = await createPost(ownerCookies);

      await request(server).patch(`/api/posts/${post.id}`).send({ title: 'hacked' }).expect(401);
    });

    it('lets admin edit any post', async () => {
      const ownerCookies = await registerAndLogin('o@bd.test', 'owner');
      await registerAndLogin('admin@bd.test', 'admin1');
      await promoteToAdmin('admin1');
      const adminCookies = (
        await request(server)
          .post('/api/auth/login')
          .send({ email: 'admin@bd.test', password: 'SecurePass123' })
          .expect(200)
      ).headers['set-cookie'] as unknown as string[];

      const post = await createPost(ownerCookies);

      await request(server)
        .patch(`/api/posts/${post.id}`)
        .set('Cookie', adminCookies)
        .send({ title: 'moderated' })
        .expect(204);
    });

    it('404s when post does not exist', async () => {
      const cookies = await registerAndLogin('a@bd.test', 'authoruser');
      await request(server)
        .patch(`/api/posts/00000000-0000-0000-0000-000000000000`)
        .set('Cookie', cookies)
        .send({ title: 'New title' })
        .expect(404);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('lets the author delete their post', async () => {
      const cookies = await registerAndLogin('a@bd.test', 'authoruser');
      const post = await createPost(cookies);

      await request(server).delete(`/api/posts/${post.id}`).set('Cookie', cookies).expect(204);
      await request(server).get(`/api/posts/${post.slug}`).expect(404);
    });

    it('rejects deletion by another user', async () => {
      const ownerCookies = await registerAndLogin('o@bd.test', 'owneruser');
      const otherCookies = await registerAndLogin('x@bd.test', 'attacker');
      const post = await createPost(ownerCookies);
      await request(server).delete(`/api/posts/${post.id}`).set('Cookie', otherCookies).expect(403);
    });
  });

  describe('publish/archive', () => {
    it('publishes a draft, archives a published post', async () => {
      const cookies = await registerAndLogin('a@bd.test', 'authoruser');
      const draft = await createPost(cookies, { status: 'draft' });

      await request(server)
        .post(`/api/posts/${draft.id}/publish`)
        .set('Cookie', cookies)
        .expect(204);

      const list = await request(server).get('/api/posts').expect(200);
      expect(list.body.total).toBe(1);

      await request(server)
        .post(`/api/posts/${draft.id}/archive`)
        .set('Cookie', cookies)
        .expect(204);

      // Archived posts disappear from the public list/detail
      const list2 = await request(server).get('/api/posts').expect(200);
      expect(list2.body.total).toBe(0);
      await request(server).get(`/api/posts/${draft.slug}`).expect(404);
    });

    it('rejects publishing an archived post (validation error)', async () => {
      const cookies = await registerAndLogin('a@bd.test', 'authoruser');
      const post = await createPost(cookies);
      await request(server)
        .post(`/api/posts/${post.id}/archive`)
        .set('Cookie', cookies)
        .expect(204);
      await request(server)
        .post(`/api/posts/${post.id}/publish`)
        .set('Cookie', cookies)
        .expect(400);
    });

    it('rejects publish from non-author', async () => {
      const ownerCookies = await registerAndLogin('o@bd.test', 'owneruser');
      const otherCookies = await registerAndLogin('x@bd.test', 'attacker');
      const post = await createPost(ownerCookies, { status: 'draft' });
      await request(server)
        .post(`/api/posts/${post.id}/publish`)
        .set('Cookie', otherCookies)
        .expect(403);
    });
  });

  describe('PATCH/DELETE comments', () => {
    async function setupPostWithComment(): Promise<{
      authorCookies: string[];
      readerCookies: string[];
      postId: string;
      commentId: string;
    }> {
      const authorCookies = await registerAndLogin('author@bd.test', 'author');
      const readerCookies = await registerAndLogin('reader@bd.test', 'reader');
      const post = await createPost(authorCookies);
      const comment = (
        await request(server)
          .post(`/api/posts/${post.id}/comments`)
          .set('Cookie', readerCookies)
          .send({ content: 'first comment' })
          .expect(201)
      ).body;
      return { authorCookies, readerCookies, postId: post.id, commentId: comment.id };
    }

    it('author of comment can edit their own', async () => {
      const { readerCookies, postId, commentId } = await setupPostWithComment();
      await request(server)
        .patch(`/api/posts/${postId}/comments/${commentId}`)
        .set('Cookie', readerCookies)
        .send({ content: 'edited comment' })
        .expect(204);

      const list = await request(server).get(`/api/posts/${postId}/comments`).expect(200);
      expect(list.body[0].content).toBe('edited comment');
      expect(list.body[0].editedAt).not.toBeNull();
    });

    it('non-author cannot edit', async () => {
      const { authorCookies, postId, commentId } = await setupPostWithComment();
      await request(server)
        .patch(`/api/posts/${postId}/comments/${commentId}`)
        .set('Cookie', authorCookies)
        .send({ content: 'hijacked' })
        .expect(403);
    });

    it('soft delete renders as [deleted] in list', async () => {
      const { readerCookies, postId, commentId } = await setupPostWithComment();
      await request(server)
        .delete(`/api/posts/${postId}/comments/${commentId}`)
        .set('Cookie', readerCookies)
        .expect(204);

      const list = await request(server).get(`/api/posts/${postId}/comments`).expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].content).toBe('[deleted]');
    });

    it('cannot edit a soft-deleted comment', async () => {
      const { readerCookies, postId, commentId } = await setupPostWithComment();
      await request(server)
        .delete(`/api/posts/${postId}/comments/${commentId}`)
        .set('Cookie', readerCookies)
        .expect(204);
      await request(server)
        .patch(`/api/posts/${postId}/comments/${commentId}`)
        .set('Cookie', readerCookies)
        .send({ content: 'cannot' })
        .expect(404);
    });
  });
});
