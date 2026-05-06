export class CommentDeletedEvent {
  constructor(
    public readonly commentId: string,
    public readonly postId: string,
  ) {}
}
