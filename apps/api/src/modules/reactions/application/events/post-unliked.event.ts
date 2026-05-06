/**
 * Emitted when a previously-existing like row is removed. Used to
 * push live count updates to feed cards.
 */
export class PostUnlikedEvent {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
  ) {}
}
