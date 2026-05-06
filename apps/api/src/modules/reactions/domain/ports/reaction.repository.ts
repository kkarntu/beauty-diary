export interface FavoriteListRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
  likesCount: number;
  commentsCount: number;
  category: { slug: string; name: string };
  author: { id: string; nickname: string; avatarUrl: string | null };
  isLikedByMe: boolean;
  favoritedAt: Date;
}

export interface ReactionRepository {
  /** Idempotent like. Returns true if a new row was inserted. */
  like(userId: string, postId: string): Promise<boolean>;

  /** Idempotent unlike. Returns true if a row was removed. */
  unlike(userId: string, postId: string): Promise<boolean>;

  favorite(userId: string, postId: string): Promise<boolean>;
  unfavorite(userId: string, postId: string): Promise<boolean>;

  listFavoritesByUser(input: {
    userId: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: FavoriteListRow[]; total: number }>;
}

export const REACTION_REPOSITORY = Symbol('REACTION_REPOSITORY');
