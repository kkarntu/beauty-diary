export class InitiateRegisterCommand {
  constructor(
    public readonly email: string,
    public readonly nickname: string,
    public readonly password: string,
  ) {}
}
