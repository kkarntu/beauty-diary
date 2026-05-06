import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditLogEntry } from '../../domain/audit-log.entity';
import type {
  AuditLogListFilters,
  AuditLogListRow,
  AuditLogRepository,
} from '../../domain/ports/audit-log.repository';
import { AuditLogOrmEntity } from './audit-log.orm-entity';

interface SqlRow {
  id: string;
  actor_id: string | null;
  actor_nickname: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

interface CountRow {
  total: string;
}

@Injectable()
export class TypeOrmAuditLogRepository implements AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async save(entry: AuditLogEntry): Promise<void> {
    const s = entry.toSnapshot();
    // Audit logs are append-only: a single INSERT is enough, no upsert needed.
    // Avoids TypeORM's _QueryDeepPartialEntity recursion through the JSONB
    // metadata field which doesn't accept a plain Record<string, unknown>.
    await this.dataSource.query(
      `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        s.id,
        s.actorId,
        s.action,
        s.targetType,
        s.targetId,
        JSON.stringify(s.metadata),
        s.createdAt,
      ],
    );
  }

  async list(filters: AuditLogListFilters): Promise<{ items: AuditLogListRow[]; total: number }> {
    const offset = (filters.page - 1) * filters.pageSize;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.action) {
      params.push(filters.action);
      conditions.push(`a.action = $${params.length}`);
    }
    if (filters.targetType) {
      params.push(filters.targetType);
      conditions.push(`a.target_type = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRow] = (await this.dataSource.query(
      `SELECT count(*)::text AS total FROM audit_logs a ${where}`,
      params,
    )) as CountRow[];
    const total = Number(countRow?.total ?? 0);

    params.push(filters.pageSize);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const rows = (await this.dataSource.query(
      `
      SELECT
        a.id, a.actor_id, a.action, a.target_type, a.target_id, a.metadata, a.created_at,
        u.nickname AS actor_nickname
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.actor_id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
      params,
    )) as SqlRow[];

    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        actorId: row.actor_id,
        actorNickname: row.actor_nickname,
        action: row.action,
        targetType: row.target_type,
        targetId: row.target_id,
        metadata: row.metadata,
        createdAt: row.created_at,
      })),
    };
  }
}
