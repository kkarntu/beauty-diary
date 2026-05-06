import type { PublicUserDto } from '@beauty-diary/shared';

export class GetUserByIdQuery {
  constructor(public readonly userId: string) {}
}

export type GetUserByIdResult = PublicUserDto;
