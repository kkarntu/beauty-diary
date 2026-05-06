/**
 * Domain event emitted whenever a new comment is persisted. The SSE
 * controller subscribes to these and pushes them to clients watching
 * a specific post's comment stream.
 */
export class CommentCreatedEvent {
  constructor(
    public readonly commentId: string,
    public readonly postId: string,
    public readonly authorId: string,
  ) {}
}
