import type { PostStatus } from '@beauty-diary/shared';
import type { Post } from '../post.entity';

export interface PostListFilters {
  page: number;
  pageSize: number;
  categorySlug?: string;
  tagSlug?: string;
  authorNickname?: string;
  sort: 'recent' | 'popular';
  /** When set, joins reaction tables to flag isLikedByMe / isFavoritedByMe per row. */
  currentUserId?: string;
  /** Free-text search against title + excerpt. */
  q?: string;
  /**
   * When set, restricts results to posts authored by this user id.
   * The published-only filter is dropped — caller is responsible for
   * making sure this is only set for the current user's own posts.
   */
  ownAuthorId?: string;
  /** Optional status filter — only meaningful together with ownAuthorId. */
  status?: PostStatus;
}

export interface PostListItemRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
  likesCount: number;
  commentsCount: number;
  status: PostStatus;
  category: { slug: string; name: string };
  author: { id: string; nickname: string; displayName: string | null; avatarUrl: string | null };
  isLikedByMe: boolean;
  isFavoritedByMe: boolean;
  allowComments: boolean;
  showInFeed: boolean;
}

export interface PostDetailRow extends PostListItemRow {
  contentHtml: string;
  createdAt: Date;
  updatedAt: Date;
  authorBio: string | null;
  tags: Array<{ slug: string; name: string }>;
}

export interface PostRepository {
  findById(id: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;
  save(post: Post): Promise<void>;
  delete(id: string): Promise<void>;
  attachTags(postId: string, tagIds: string[]): Promise<void>;
  detachAllTags(postId: string): Promise<void>;

  // Read models — bypass the domain entity for efficient JOINed queries.
  list(filters: PostListFilters): Promise<{ items: PostListItemRow[]; total: number }>;
  detailBySlug(slug: string, currentUserId?: string): Promise<PostDetailRow | null>;
}

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');
