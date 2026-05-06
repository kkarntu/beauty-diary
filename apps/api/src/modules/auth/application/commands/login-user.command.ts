export class LoginUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

export interface LoginUserResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}
