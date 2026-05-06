import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from '../../../support/app-factory';

describe('Profile + categories (integration)', () => {
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
      'TRUNCATE TABLE "password_reset_tokens", "refresh_tokens", "users" RESTART IDENTITY CASCADE',
    );
  });

  it('exposes the seeded categories', async () => {
    const res = await request(server).get('/api/categories').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(6);
    const slugs = res.body.map((c: { slug: string }) => c.slug);
    expect(slugs).toEqual(
      expect.arrayContaining(['skincare', 'makeup', 'fashion', 'wellness', 'hair', 'lifestyle']),
    );
  });

  it('updates own profile and exposes the change publicly', async () => {
    const credentials = {
      email: 'profile@beauty-diary.test',
      password: 'sup3rSecret!',
      nickname: 'profileuser',
    };

    await request(server).post('/api/auth/register').send(credentials).expect(201);
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const cookies = login.headers['set-cookie'] as unknown as string[];

    const updated = await request(server)
      .patch('/api/users/me')
      .set('Cookie', cookies)
      .send({ displayName: 'Anna B.', bio: 'Beauty enthusiast' })
      .expect(200);
    expect(updated.body.displayName).toBe('Anna B.');
    expect(updated.body.bio).toBe('Beauty enthusiast');

    const publicProfile = await request(server)
      .get(`/api/users/${credentials.nickname}`)
      .expect(200);
    expect(publicProfile.body.displayName).toBe('Anna B.');
    expect(publicProfile.body.bio).toBe('Beauty enthusiast');
    // PublicUserDto must not leak email
    expect(publicProfile.body.email).toBeUndefined();
  });

  it('rejects PATCH /me without auth', async () => {
    await request(server).patch('/api/users/me').send({ bio: 'whatever' }).expect(401);
  });

  it('returns 404 for unknown nickname', async () => {
    await request(server).get('/api/users/nope-nope-nope').expect(404);
  });
});
