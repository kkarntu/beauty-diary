import { z } from 'zod';
import { LIMITS, PAGINATION } from '../constants';
import { PostStatus } from '../enums';

export const CreatePostDto = z.object({
  title: z.string().min(LIMITS.POST_TITLE_MIN).max(LIMITS.POST_TITLE_MAX),
  excerpt: z.string().max(LIMITS.POST_EXCERPT_MAX).optional(),
  /** Tiptap HTML output. Server sanitizes on save. */
  contentHtml: z.string().min(LIMITS.POST_CONTENT_MIN),
  categoryId: z.string().uuid(),
  tagSlugs: z.array(z.string()).max(10).default([]),
  coverImageUrl: z.string().url().optional(),
  status: z.enum([PostStatus.DRAFT, PostStatus.PUBLISHED]).default(PostStatus.DRAFT),
  /** When false, the comment thread on the post is hidden + new comments rejected. */
  allowComments: z.boolean().default(true),
  /** When false, the post is excluded from the public feed (still reachable by direct link). */
  showInFeed: z.boolean().default(true),
});
export type CreatePostDto = z.infer<typeof CreatePostDto>;

export const UpdatePostDto = CreatePostDto.partial();
export type UpdatePostDto = z.infer<typeof UpdatePostDto>;

export const PostListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  authorNickname: z.string().optional(),
  sort: z.enum(['recent', 'popular']).default('recent'),
  /** Free-text search against title + excerpt (case-insensitive). */
  q: z.string().min(1).max(100).optional(),
  /**
   * When true, returns the *current user's* own posts including drafts /
   * archived. Requires authentication; ignored if no user is attached.
   */
  mine: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .optional(),
  /**
   * Filter by status. Only honored together with `mine=true` — drafts
   * and archived posts of other authors are never returned.
   */
  status: z.enum([PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED]).optional(),
});
export type PostListQueryDto = z.infer<typeof PostListQueryDto>;

export const PostListItemDto = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  coverImageUrl: z.string().url().nullable(),
  status: z.enum([PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED]),
  category: z.object({ slug: z.string(), name: z.string() }),
  author: z.object({
    id: z.string().uuid(),
    nickname: z.string(),
    avatarUrl: z.string().url().nullable(),
  }),
  publishedAt: z.string().datetime().nullable(),
  readingMinutes: z.number().int(),
  likesCount: z.number().int(),
  commentsCount: z.number().int(),
  // Reflect the current viewer's reaction state. False for anonymous viewers.
  isLikedByMe: z.boolean().default(false),
  isFavoritedByMe: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  showInFeed: z.boolean().default(true),
});
export type PostListItemDto = z.infer<typeof PostListItemDto>;

export const PostListResponseDto = z.object({
  items: z.array(PostListItemDto),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type PostListResponseDto = z.infer<typeof PostListResponseDto>;

export const PostDetailDto = PostListItemDto.extend({
  contentHtml: z.string(),
  status: z.enum([PostStatus.DRAFT, PostStatus.PUBLISHED, PostStatus.ARCHIVED]),
  tags: z.array(z.object({ slug: z.string(), name: z.string() })),
  author: z.object({
    id: z.string().uuid(),
    nickname: z.string(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().url().nullable(),
    bio: z.string().nullable(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PostDetailDto = z.infer<typeof PostDetailDto>;
