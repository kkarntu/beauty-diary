import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from '../../support/app-factory';

describe('Admin (integration)', () => {
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
      'TRUNCATE TABLE "audit_logs", "post_likes", "post_favorites", "comments", "post_tags", "tags", "posts", "password_reset_tokens", "refresh_tokens", "users" RESTART IDENTITY CASCADE',
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

  async function promoteToAdmin(nickname: string): Promise<void> {
    const ds = app.get(DataSource);
    await ds.query(`UPDATE users SET role = 'admin' WHERE nickname = $1`, [nickname]);
  }

  async function freshAdminCookies(email: string, nickname: string): Promise<string[]> {
    await request(server)
      .post('/api/auth/register')
      .send({ email, password: 'SecurePass123', nickname })
      .expect(201);
    await promoteToAdmin(nickname);
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'SecurePass123' })
      .expect(200);
    return res.headers['set-cookie'] as unknown as string[];
  }

  it('rejects non-admin access to /api/admin/* (403)', async () => {
    const userCookies = await login('user@bd.test', 'plainuser');
    await request(server).get('/api/admin/users').set('Cookie', userCookies).expect(403);
    await request(server).get('/api/admin/audit-log').set('Cookie', userCookies).expect(403);
  });

  it('rejects unauthenticated access (401)', async () => {
    await request(server).get('/api/admin/users').expect(401);
  });

  it('admin lists users with filters', async () => {
    const adminCookies = await freshAdminCookies('admin@bd.test', 'adminuser');
    await login('a@bd.test', 'authoruser');
    await login('b@bd.test', 'readeruser');

    const all = await request(server)
      .get('/api/admin/users?page=1&pageSize=20')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(all.body.total).toBe(3);

    const adminsOnly = await request(server)
      .get('/api/admin/users?role=admin')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(adminsOnly.body.total).toBe(1);
    expect(adminsOnly.body.items[0].nickname).toBe('adminuser');

    const search = await request(server)
      .get('/api/admin/users?search=author')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(search.body.total).toBe(1);
    expect(search.body.items[0].nickname).toBe('authoruser');
  });

  it('admin blocks a user; user can no longer log in; audit log records the action', async () => {
    const adminCookies = await freshAdminCookies('admin@bd.test', 'adminuser');
    await login('victim@bd.test', 'victimuser');
    const targetId = (
      await request(server)
        .get('/api/admin/users?search=victim')
        .set('Cookie', adminCookies)
        .expect(200)
    ).body.items[0].id;

    await request(server)
      .patch(`/api/admin/users/${targetId}`)
      .set('Cookie', adminCookies)
      .send({ isBlocked: true })
      .expect(204);

    // Login attempt now fails because the User entity rejects blocked accounts
    await request(server)
      .post('/api/auth/login')
      .send({ email: 'victim@bd.test', password: 'SecurePass123' })
      .expect(401);

    const log = await request(server)
      .get('/api/admin/audit-log')
      .set('Cookie', adminCookies)
      .expect(200);
    expect(log.body.total).toBeGreaterThanOrEqual(1);
    const entry = log.body.items.find(
      (e: { action: string; targetId: string }) =>
        e.action === 'user.state_changed' && e.targetId === targetId,
    );
    expect(entry).toBeDefined();
    expect(entry.metadata.isBlockedTo).toBe(true);
    expect(entry.actorNickname).toBe('adminuser');
  });

  it('admin promotes another user to admin', async () => {
    const adminCookies = await freshAdminCookies('admin@bd.test', 'adminuser');
    await login('next@bd.test', 'nextadmin');
    const targetId = (
      await request(server)
        .get('/api/admin/users?search=nextadmin')
        .set('Cookie', adminCookies)
        .expect(200)
    ).body.items[0].id;

    await request(server)
      .patch(`/api/admin/users/${targetId}`)
      .set('Cookie', adminCookies)
      .send({ role: 'admin' })
      .expect(204);

    const after = await request(server)
      .get(`/api/admin/users?search=nextadmin`)
      .set('Cookie', adminCookies)
      .expect(200);
    expect(after.body.items[0].role).toBe('admin');
  });

  it('admin cannot modify their own state', async () => {
    const adminCookies = await freshAdminCookies('admin@bd.test', 'adminuser');
    const meId = (
      await request(server)
        .get('/api/auth/me')
        .set('Cookie', adminCookies)
        .expect(200)
    ).body.id;

    await request(server)
      .patch(`/api/admin/users/${meId}`)
      .set('Cookie', adminCookies)
      .send({ isBlocked: true })
      .expect(403);
  });

  it('rejects empty body (must specify at least one field)', async () => {
    const adminCookies = await freshAdminCookies('admin@bd.test', 'adminuser');
    await login('t@bd.test', 'targetuser');
    const targetId = (
      await request(server)
        .get('/api/admin/users?search=target')
        .set('Cookie', adminCookies)
        .expect(200)
    ).body.items[0].id;

    await request(server)
      .patch(`/api/admin/users/${targetId}`)
      .set('Cookie', adminCookies)
      .send({})
      .expect(400);
  });
});
