/**
 * Domain event emitted when a user likes a post for the first time.
 * Re-likes (idempotent) do NOT re-emit — the reaction repo's `like()`
 * returns a boolean indicating whether a fresh row was inserted, and
 * only that case publishes the event.
 *
 * The notifications module subscribes to this to email + push the post
 * author. Self-likes are filtered there (not here), so the domain layer
 * stays free of cross-module knowledge.
 */
export class PostLikedEvent {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
  ) {}
}
