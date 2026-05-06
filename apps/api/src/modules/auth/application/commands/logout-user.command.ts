export class LogoutUserCommand {
  constructor(public readonly rawRefreshToken: string | undefined) {}
}
