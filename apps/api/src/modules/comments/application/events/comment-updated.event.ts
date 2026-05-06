export class CommentUpdatedEvent {
  constructor(
    public readonly commentId: string,
    public readonly postId: string,
  ) {}
}
