import type { Tag } from '../tag.entity';

export interface TrendingTagRow {
  slug: string;
  name: string;
  postCount: number;
}

export interface TagRepository {
  findOrCreateMany(slugs: string[]): Promise<Tag[]>;
  findBySlug(slug: string): Promise<Tag | null>;
  /**
   * Returns the most-used tags across published posts, ordered by usage
   * count descending. Caps the result at `limit`.
   */
  findTrending(limit: number): Promise<TrendingTagRow[]>;
}

export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');
