import type { PostStatus } from '@beauty-diary/shared';
import { InvalidPostStatusTransitionError } from './post.errors';

export interface PostSnapshot {
  id: string;
  authorId: string;
  categoryId: string;
  slug: string;
  title: string;
  excerpt: string | null;
  /** Sanitized HTML output by Tiptap. Sanitization happens in the application layer before reaching the entity. */
  contentHtml: string;
  coverImageUrl: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  readingMinutes: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  allowComments: boolean;
  showInFeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WORDS_PER_MINUTE = 200;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ');
}

function computeReadingMinutes(contentHtml: string): number {
  const text = stripHtml(contentHtml);
  const words = text.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export class Post {
  private constructor(private readonly state: PostSnapshot) {}

  static rehydrate(snapshot: PostSnapshot): Post {
    return new Post(snapshot);
  }

  static create(input: {
    id: string;
    authorId: string;
    categoryId: string;
    slug: string;
    title: string;
    excerpt: string | null;
    contentHtml: string;
    coverImageUrl: string | null;
    status: PostStatus;
    allowComments?: boolean;
    showInFeed?: boolean;
  }): Post {
    const now = new Date();
    return new Post({
      id: input.id,
      authorId: input.authorId,
      categoryId: input.categoryId,
      slug: input.slug,
      title: input.title.trim(),
      excerpt: input.excerpt,
      contentHtml: input.contentHtml,
      coverImageUrl: input.coverImageUrl,
      status: input.status,
      publishedAt: input.status === 'published' ? now : null,
      readingMinutes: computeReadingMinutes(input.contentHtml),
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      allowComments: input.allowComments ?? true,
      showInFeed: input.showInFeed ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  get allowComments(): boolean {
    return this.state.allowComments;
  }

  get showInFeed(): boolean {
    return this.state.showInFeed;
  }

  get id(): string {
    return this.state.id;
  }

  get authorId(): string {
    return this.state.authorId;
  }

  get slug(): string {
    return this.state.slug;
  }

  get status(): PostStatus {
    return this.state.status;
  }

  get isPublished(): boolean {
    return this.state.status === 'published';
  }

  toSnapshot(): PostSnapshot {
    return { ...this.state };
  }

  publish(): void {
    if (this.state.status === 'published') return;
    if (this.state.status === 'archived') {
      throw new InvalidPostStatusTransitionError('archived', 'published');
    }
    this.state.status = 'published';
    this.state.publishedAt = new Date();
    this.state.updatedAt = new Date();
  }

  archive(): void {
    if (this.state.status === 'archived') return;
    this.state.status = 'archived';
    this.state.updatedAt = new Date();
  }

  incrementCommentsCount(): void {
    this.state.commentsCount += 1;
    this.state.updatedAt = new Date();
  }

  update(input: {
    title?: string;
    excerpt?: string | null;
    contentHtml?: string;
    coverImageUrl?: string | null;
    categoryId?: string;
    allowComments?: boolean;
    showInFeed?: boolean;
  }): void {
    let changed = false;
    if (input.title !== undefined) {
      this.state.title = input.title.trim();
      changed = true;
    }
    if (input.excerpt !== undefined) {
      this.state.excerpt = input.excerpt;
      changed = true;
    }
    if (input.contentHtml !== undefined) {
      this.state.contentHtml = input.contentHtml;
      this.state.readingMinutes = computeReadingMinutes(input.contentHtml);
      changed = true;
    }
    if (input.coverImageUrl !== undefined) {
      this.state.coverImageUrl = input.coverImageUrl;
      changed = true;
    }
    if (input.categoryId !== undefined) {
      this.state.categoryId = input.categoryId;
      changed = true;
    }
    if (input.allowComments !== undefined) {
      this.state.allowComments = input.allowComments;
      changed = true;
    }
    if (input.showInFeed !== undefined) {
      this.state.showInFeed = input.showInFeed;
      changed = true;
    }
    if (changed) {
      this.state.updatedAt = new Date();
    }
  }

  isOwnedBy(userId: string): boolean {
    return this.state.authorId === userId;
  }
}
