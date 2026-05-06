/**
 * Domain event emitted whenever someone follows another user. The
 * notifications module subscribes to it to email the followee.
 */
export class UserFollowedEvent {
  constructor(
    public readonly followerId: string,
    public readonly followeeId: string,
  ) {}
}
