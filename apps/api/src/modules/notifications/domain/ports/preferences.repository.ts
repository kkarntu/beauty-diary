export interface NotificationPreferences {
  newFollower: boolean;
  newComment: boolean;
  newLike: boolean;
  newsletter: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  newFollower: true,
  newComment: true,
  newLike: false,
  newsletter: false,
};

export interface NotificationPreferencesRepository {
  /** Returns the user's preferences, or `DEFAULT_PREFERENCES` if no row exists. */
  findByUserId(userId: string): Promise<NotificationPreferences>;
  upsert(userId: string, patch: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
}

export const NOTIFICATION_PREFERENCES_REPOSITORY = Symbol('NOTIFICATION_PREFERENCES_REPOSITORY');
