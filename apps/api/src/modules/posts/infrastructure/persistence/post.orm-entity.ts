import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { PostStatus } from '@beauty-diary/shared';

@Entity({ name: 'posts' })
@Index('uq_posts_slug', ['slug'], { unique: true })
@Index('idx_posts_author_created_at', ['authorId', 'createdAt'])
@Index('idx_posts_category_published_at', ['categoryId', 'publishedAt'])
@Index('idx_posts_published_at', ['publishedAt'])
export class PostOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'citext' })
  slug!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  excerpt!: string | null;

  @Column({ name: 'content_html', type: 'text' })
  contentHtml!: string;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: 'text', default: 'draft' })
  status!: PostStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'reading_minutes', type: 'int', default: 1 })
  readingMinutes!: number;

  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount!: number;

  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount!: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount!: number;

  @Column({ name: 'allow_comments', type: 'boolean', default: true })
  allowComments!: boolean;

  @Column({ name: 'show_in_feed', type: 'boolean', default: true })
  showInFeed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
