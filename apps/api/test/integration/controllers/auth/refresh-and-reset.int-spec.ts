import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { createTestApp } from '../../../support/app-factory';

/**
 * The refresh-rotation and password-reset flows aren't covered elsewhere.
 * They're security-critical, so we exercise them end-to-end against the real
 * stack (real Postgres, real JWT, real DOMPurify).
 */
describe('Auth — refresh rotation + password reset (integration)', () => {
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

  async function register(email: string, nickname: string): Promise<string[]> {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ email, password: 'SecurePass123', nickname })
      .expect(201);
    return res.headers['set-cookie'] as unknown as string[];
  }

  describe('refresh rotation', () => {
    it('issues new tokens; the old refresh token cannot be reused', async () => {
      const cookies = await register('rot@bd.test', 'rotuser');

      const first = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);
      const newCookies = first.headers['set-cookie'] as unknown as string[];
      expect(newCookies).toBeDefined();

      // Replaying the original refresh cookie now triggers reuse detection
      const replay = await request(server).post('/api/auth/refresh').set('Cookie', cookies);
      expect(replay.status).toBe(401);
      expect(replay.body.code).toBe('REFRESH_TOKEN_REUSED');

      // After reuse detection the new token is also revoked — user must re-login
      const afterReuse = await request(server).post('/api/auth/refresh').set('Cookie', newCookies);
      expect(afterReuse.status).toBe(401);
    });

    it('logout revokes the refresh token; subsequent refresh fails', async () => {
      const cookies = await register('lo@bd.test', 'logoutuser');
      await request(server).post('/api/auth/logout').set('Cookie', cookies).expect(204);
      await request(server).post('/api/auth/refresh').set('Cookie', cookies).expect(401);
    });
  });

  describe('password reset', () => {
    it('returns 204 for unknown emails (no enumeration)', async () => {
      await request(server)
        .post('/api/auth/password/request-reset')
        .send({ email: 'nobody@bd.test' })
        .expect(204);
    });

    it('end-to-end: request → use token → old password no longer works → new does', async () => {
      await register('pr@bd.test', 'pruser');

      // Request reset
      await request(server)
        .post('/api/auth/password/request-reset')
        .send({ email: 'pr@bd.test' })
        .expect(204);

      // Pull the raw token out of the DB. In production this would arrive by
      // email; for tests we just read what would have been sent. We store
      // sha256(raw) in the row, so we can't recover the raw token here —
      // instead we simulate the link click by writing a known token directly.
      const ds = app.get(DataSource);
      const userId = (
        (await ds.query(`SELECT id FROM users WHERE email = $1`, ['pr@bd.test'])) as Array<{
          id: string;
        }>
      )[0]!.id;

      const knownRaw = 'test-known-raw-token';
      const knownHash = createHash('sha256').update(knownRaw).digest('hex');
      await ds.query(
        `UPDATE password_reset_tokens
         SET token_hash = $1
         WHERE user_id = $2 AND used_at IS NULL`,
        [knownHash, userId],
      );

      // Old password still works at this point
      await request(server)
        .post('/api/auth/login')
        .send({ email: 'pr@bd.test', password: 'SecurePass123' })
        .expect(200);

      // Apply the reset
      await request(server)
        .post('/api/auth/password/reset')
        .send({ token: knownRaw, password: 'NewSecure456!' })
        .expect(204);

      // Old password rejected
      await request(server)
        .post('/api/auth/login')
        .send({ email: 'pr@bd.test', password: 'SecurePass123' })
        .expect(401);

      // New password works
      await request(server)
        .post('/api/auth/login')
        .send({ email: 'pr@bd.test', password: 'NewSecure456!' })
        .expect(200);

      // Token is single-use
      await request(server)
        .post('/api/auth/password/reset')
        .send({ token: knownRaw, password: 'AnotherPass789!' })
        .expect(404);
    });
  });
});
