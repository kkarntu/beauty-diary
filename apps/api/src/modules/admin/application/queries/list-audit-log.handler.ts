import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { AuditLogEntryDto } from '@beauty-diary/shared';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditLogRepository,
} from '../../domain/ports/audit-log.repository';
import { ListAuditLogQuery, type ListAuditLogResult } from './list-audit-log.query';

@QueryHandler(ListAuditLogQuery)
export class ListAuditLogHandler implements IQueryHandler<ListAuditLogQuery, ListAuditLogResult> {
  constructor(@Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogs: AuditLogRepository) {}

  async execute(query: ListAuditLogQuery): Promise<ListAuditLogResult> {
    const { items, total } = await this.auditLogs.list({
      page: query.page,
      pageSize: query.pageSize,
      action: query.action,
      targetType: query.targetType,
    });

    const mapped: AuditLogEntryDto[] = items.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      actorNickname: row.actorNickname,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    }));

    return { items: mapped, total, page: query.page, pageSize: query.pageSize };
  }
}
