import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { FavoriteListRow, ReactionRepository } from '../../domain/ports/reaction.repository';
import { PostFavoriteOrmEntity } from './post-favorite.orm-entity';
import { PostLikeOrmEntity } from './post-like.orm-entity';

interface CountRow {
  total: string;
}

interface FavoriteSqlRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: Date | null;
  reading_minutes: number;
  likes_count: number;
  comments_count: number;
  category_slug: string;
  category_name: string;
  author_id: string;
  author_nickname: string;
  author_avatar_url: string | null;
  is_liked_by_me: boolean | null;
  favorited_at: Date;
}

@Injectable()
export class TypeOrmReactionRepository implements ReactionRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Using QueryBuilder with the entity class so TypeORM maps userId/postId
  // → user_id/post_id columns. Returns a typed { raw, affected } result —
  // more reliable than dataSource.query() for DML.

  async like(userId: string, postId: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(PostLikeOrmEntity)
      .values({ userId, postId })
      .orIgnore()
      .execute();
    // With orIgnore + a conflict, raw is an empty array; otherwise it
    // contains the inserted row.
    return Array.isArray(result.raw) && result.raw.length > 0;
  }

  async unlike(userId: string, postId: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(PostLikeOrmEntity)
      .where('user_id = :userId AND post_id = :postId', { userId, postId })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async favorite(userId: string, postId: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(PostFavoriteOrmEntity)
      .values({ userId, postId })
      .orIgnore()
      .execute();
    return Array.isArray(result.raw) && result.raw.length > 0;
  }

  async unfavorite(userId: string, postId: string): Promise<boolean> {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(PostFavoriteOrmEntity)
      .where('user_id = :userId AND post_id = :postId', { userId, postId })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async listFavoritesByUser(input: {
    userId: string;
    page: number;
    pageSize: number;
  }): Promise<{ items: FavoriteListRow[]; total: number }> {
    const offset = (input.page - 1) * input.pageSize;

    const [countRow] = (await this.dataSource.query(
      `SELECT count(*)::text AS total FROM post_favorites WHERE user_id = $1`,
      [input.userId],
    )) as CountRow[];
    const total = Number(countRow?.total ?? 0);

    const rows = (await this.dataSource.query(
      `
      SELECT
        p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.published_at,
        p.reading_minutes, p.likes_count, p.comments_count,
        c.slug AS category_slug, c.name AS category_name,
        u.id AS author_id, u.nickname AS author_nickname, u.avatar_url AS author_avatar_url,
        (pl.user_id IS NOT NULL) AS is_liked_by_me,
        f.created_at AS favorited_at
      FROM post_favorites f
      INNER JOIN posts p ON p.id = f.post_id AND p.status = 'published'
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN users u ON u.id = p.author_id
      LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = $1
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `,
      [input.userId, input.pageSize, offset],
    )) as FavoriteSqlRow[];

    return {
      total,
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        coverImageUrl: row.cover_image_url,
        publishedAt: row.published_at,
        readingMinutes: row.reading_minutes,
        likesCount: row.likes_count,
        commentsCount: row.comments_count,
        category: { slug: row.category_slug, name: row.category_name },
        author: {
          id: row.author_id,
          nickname: row.author_nickname,
          avatarUrl: row.author_avatar_url,
        },
        isLikedByMe: row.is_liked_by_me === true,
        favoritedAt: row.favorited_at,
      })),
    };
  }
}
