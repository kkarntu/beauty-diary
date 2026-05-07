export interface VerifyRegisterResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export class VerifyRegisterCommand {
  constructor(
    public readonly email: string,
    public readonly otp: string,
  ) {}
}
