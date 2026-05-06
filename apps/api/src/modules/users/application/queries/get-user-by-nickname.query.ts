import type { PublicUserDto } from '@beauty-diary/shared';

export class GetUserByNicknameQuery {
  constructor(
    public readonly nickname: string,
    /** When set, the result includes whether this viewer follows the target. */
    public readonly currentUserId?: string,
  ) {}
}

export type GetUserByNicknameResult = PublicUserDto;
