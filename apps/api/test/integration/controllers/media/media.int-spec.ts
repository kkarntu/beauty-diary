import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from '../../support/app-factory';

describe('Media — presigned upload (integration)', () => {
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

  it('issues a presigned upload URL for an authenticated user', async () => {
    const cookies = await login('media@bd.test', 'mediauser');

    const res = await request(server)
      .post('/api/media/upload-url')
      .set('Cookie', cookies)
      .send({
        filename: 'cover image (1).jpeg',
        contentType: 'image/jpeg',
        byteSize: 100_000,
      })
      .expect(200);

    expect(res.body.key).toMatch(/^users\/[0-9a-f-]+\/[0-9a-f-]+-cover-image-1\.jpeg$/);
    expect(res.body.uploadUrl).toMatch(/^https?:\/\//);
    expect(res.body.publicUrl).toContain(res.body.key);
    expect(res.body.uploadHeaders['Content-Type']).toBe('image/jpeg');
    expect(res.body.uploadHeaders['Content-Length']).toBe('100000');
    expect(res.body.expiresInSeconds).toBe(600);
  });

  it('rejects unauthenticated requests', async () => {
    await request(server)
      .post('/api/media/upload-url')
      .send({
        filename: 'cover.jpg',
        contentType: 'image/jpeg',
        byteSize: 1000,
      })
      .expect(401);
  });

  it('rejects oversized uploads', async () => {
    const cookies = await login('media@bd.test', 'mediauser');
    await request(server)
      .post('/api/media/upload-url')
      .set('Cookie', cookies)
      .send({
        filename: 'huge.jpg',
        contentType: 'image/jpeg',
        byteSize: 50 * 1024 * 1024, // 50 MB > 5 MB cap
      })
      .expect(400);
  });

  it('rejects disallowed mime types', async () => {
    const cookies = await login('media@bd.test', 'mediauser');
    await request(server)
      .post('/api/media/upload-url')
      .set('Cookie', cookies)
      .send({
        filename: 'evil.exe',
        contentType: 'application/octet-stream',
        byteSize: 1000,
      })
      .expect(400);
  });
});
