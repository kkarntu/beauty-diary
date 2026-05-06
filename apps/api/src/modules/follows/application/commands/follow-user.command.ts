export class FollowUserCommand {
  constructor(
    public readonly followerId: string,
    public readonly followeeNickname: string,
  ) {}
}

export class UnfollowUserCommand {
  constructor(
    public readonly followerId: string,
    public readonly followeeNickname: string,
  ) {}
}
