export class ResetPasswordCommand {
  constructor(
    public readonly rawToken: string,
    public readonly newPassword: string,
  ) {}
}
