import 'server-only';

import type { PublicUserDto } from '@beauty-diary/shared';
import { serverFetch } from './fetch';

export async function fetchUserByNickname(nickname: string): Promise<PublicUserDto> {
  return serverFetch<PublicUserDto>(`/api/users/${encodeURIComponent(nickname)}`);
}
