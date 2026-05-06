export class LikePostCommand {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
  ) {}
}

export class UnlikePostCommand {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
  ) {}
}

export class FavoritePostCommand {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
  ) {}
}

export class UnfavoritePostCommand {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
  ) {}
}
