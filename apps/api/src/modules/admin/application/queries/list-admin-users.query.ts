import type { AdminUserListResponseDto, UserRole } from '@beauty-diary/shared';

export class ListAdminUsersQuery {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly role?: UserRole,
    public readonly isBlocked?: boolean,
    public readonly search?: string,
  ) {}
}

export type ListAdminUsersResult = AdminUserListResponseDto;
