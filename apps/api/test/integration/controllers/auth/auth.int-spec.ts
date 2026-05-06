import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from '../../../support/app-factory';

describe('Auth flow (integration)', () => {
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

  it('register → login → /auth/me → logout', async () => {
    const credentials = {
      email: 'user1@beauty-diary.test',
      password: 'sup3rSecret!',
      nickname: 'user1',
    };

    const register = await request(server).post('/api/auth/register').send(credentials).expect(201);
    expect(register.headers['set-cookie']).toBeDefined();
    expect(register.body.id).toBeDefined();

    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    const cookies = login.headers['set-cookie'] as unknown as string[];

    const me = await request(server).get('/api/auth/me').set('Cookie', cookies).expect(200);
    expect(me.body.email).toBe(credentials.email);
    expect(me.body.nickname).toBe(credentials.nickname);
    expect(me.body.role).toBe('user');

    await request(server).post('/api/auth/logout').set('Cookie', cookies).expect(204);
  });

  it('rejects /auth/me without auth', async () => {
    await request(server).get('/api/auth/me').expect(401);
  });

  it('rejects duplicate registration', async () => {
    const credentials = {
      email: 'dup@beauty-diary.test',
      password: 'sup3rSecret!',
      nickname: 'dupnick',
    };
    await request(server).post('/api/auth/register').send(credentials).expect(201);
    await request(server).post('/api/auth/register').send(credentials).expect(409);
  });
});
