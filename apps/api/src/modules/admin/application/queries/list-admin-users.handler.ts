import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { AdminUserDto, UserRole } from '@beauty-diary/shared';
import {
  ListAdminUsersQuery,
  type ListAdminUsersResult,
} from './list-admin-users.query';

interface SqlRow {
  id: string;
  email: string;
  nickname: string;
  display_name: string | null;
  role: UserRole;
  is_blocked: boolean;
  email_verified_at: Date | null;
  created_at: Date;
}

interface CountRow {
  total: string;
}

@QueryHandler(ListAdminUsersQuery)
@Injectable()
export class ListAdminUsersHandler
  implements IQueryHandler<ListAdminUsersQuery, ListAdminUsersResult>
{
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async execute(query: ListAdminUsersQuery): Promise<ListAdminUsersResult> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (query.role !== undefined) {
      params.push(query.role);
      conditions.push(`u.role = $${params.length}`);
    }
    if (query.isBlocked !== undefined) {
      params.push(query.isBlocked);
      conditions.push(`u.is_blocked = $${params.length}`);
    }
    if (query.search) {
      params.push(`%${query.search.toLowerCase()}%`);
      const idx = params.length;
      conditions.push(
        `(LOWER(u.email::text) LIKE $${idx} OR LOWER(u.nickname::text) LIKE $${idx})`,
      );
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRow] = (await this.dataSource.query(
      `SELECT count(*)::text AS total FROM users u ${where}`,
      params,
    )) as CountRow[];
    const total = Number(countRow?.total ?? 0);

    const offset = (query.page - 1) * query.pageSize;
    params.push(query.pageSize);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const rows = (await this.dataSource.query(
      `
      SELECT u.id, u.email, u.nickname, u.display_name, u.role, u.is_blocked,
             u.email_verified_at, u.created_at
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
      params,
    )) as SqlRow[];

    const items: AdminUserDto[] = rows.map((row) => ({
      id: row.id,
      email: row.email,
      nickname: row.nickname,
      displayName: row.display_name,
      role: row.role,
      isBlocked: row.is_blocked,
      emailVerifiedAt: row.email_verified_at ? row.email_verified_at.toISOString() : null,
      createdAt: row.created_at.toISOString(),
    }));

    return { items, total, page: query.page, pageSize: query.pageSize };
  }
}
