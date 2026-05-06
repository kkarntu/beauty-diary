import 'server-only';

import type { AdminUserListResponseDto, AuditLogListResponseDto } from '@beauty-diary/shared';
import { serverFetch } from './fetch';

export interface AdminUsersFilter {
  page?: number;
  pageSize?: number;
  role?: 'user' | 'admin';
  isBlocked?: boolean;
  search?: string;
}

export async function fetchAdminUsers(f: AdminUsersFilter = {}): Promise<AdminUserListResponseDto> {
  const p = new URLSearchParams();
  if (f.page) p.set('page', String(f.page));
  if (f.pageSize) p.set('pageSize', String(f.pageSize));
  if (f.role) p.set('role', f.role);
  if (f.isBlocked !== undefined) p.set('isBlocked', String(f.isBlocked));
  if (f.search) p.set('search', f.search);
  const qs = p.toString();
  return serverFetch<AdminUserListResponseDto>(`/api/admin/users${qs ? `?${qs}` : ''}`);
}

export interface AuditLogFilter {
  page?: number;
  pageSize?: number;
  action?: string;
  targetType?: string;
}

export async function fetchAuditLog(f: AuditLogFilter = {}): Promise<AuditLogListResponseDto> {
  const p = new URLSearchParams();
  if (f.page) p.set('page', String(f.page));
  if (f.pageSize) p.set('pageSize', String(f.pageSize));
  if (f.action) p.set('action', f.action);
  if (f.targetType) p.set('targetType', f.targetType);
  const qs = p.toString();
  return serverFetch<AuditLogListResponseDto>(`/api/admin/audit-log${qs ? `?${qs}` : ''}`);
}
