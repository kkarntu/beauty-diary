import type { AuditLogListResponseDto } from '@beauty-diary/shared';

export class ListAuditLogQuery {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly action?: string,
    public readonly targetType?: string,
  ) {}
}

export type ListAuditLogResult = AuditLogListResponseDto;
