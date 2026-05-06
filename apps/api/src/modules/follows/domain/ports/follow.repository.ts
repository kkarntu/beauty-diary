export interface FollowRepository {
  /**
   * Idempotent follow. Returns true if a new edge was inserted, false if
   * it already existed.
   */
  follow(followerId: string, followeeId: string): Promise<boolean>;

  /** Idempotent unfollow. Returns true if an edge was removed. */
  unfollow(followerId: string, followeeId: string): Promise<boolean>;

  isFollowing(followerId: string, followeeId: string): Promise<boolean>;
}

export const FOLLOW_REPOSITORY = Symbol('FOLLOW_REPOSITORY');
