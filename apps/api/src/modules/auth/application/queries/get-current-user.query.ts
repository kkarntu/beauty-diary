import type { CurrentUserDto } from '@beauty-diary/shared';

export class GetCurrentUserQuery {
  constructor(public readonly userId: string) {}
}

export type GetCurrentUserResult = CurrentUserDto;
