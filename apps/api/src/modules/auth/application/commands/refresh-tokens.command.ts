export class RefreshTokensCommand {
  constructor(public readonly rawRefreshToken: string) {}
}

export interface RefreshTokensResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}
