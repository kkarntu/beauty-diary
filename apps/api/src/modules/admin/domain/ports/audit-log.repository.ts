import type { AuditLogEntry } from '../audit-log.entity';

export interface AuditLogListFilters {
  page: number;
  pageSize: number;
  action?: string;
  targetType?: string;
}

export interface AuditLogListRow {
  id: string;
  actorId: string | null;
  actorNickname: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLogRepository {
  save(entry: AuditLogEntry): Promise<void>;
  list(
    filters: AuditLogListFilters,
  ): Promise<{ items: AuditLogListRow[]; total: number }>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
