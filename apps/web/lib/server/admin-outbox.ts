import 'server-only';

import { serverFetch } from './fetch';

export interface FailedOutboxEntryDto {
  id: string;
  toEmail: string;
  subject: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
}

export interface FailedOutboxResponse {
  items: FailedOutboxEntryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchFailedOutbox(
  page = 1,
  pageSize = 50,
): Promise<FailedOutboxResponse> {
  return serverFetch<FailedOutboxResponse>(
    `/api/admin/email-outbox/failed?page=${page}&pageSize=${pageSize}`,
  );
}
