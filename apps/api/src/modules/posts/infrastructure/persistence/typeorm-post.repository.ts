import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PostStatus } from '@beauty-diary/shared';
import { Post } from '../../domain/post.entity';
import type {
  PostDetailRow,
  PostListFilters,
  PostListItemRow,
  PostRepository,
} from '../../domain/ports/post.repository';
import { PostMapper } from '../mappers/post.mapper';
import { PostOrmEntity } from './post.orm-entity';
import { PostTagOrmEntity } from './post-tag.orm-entity';

interface ListItemSqlRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: Date | null;
  reading_minutes: number;
  likes_count: number;
  comments_count: number;
  status: PostStatus;
  category_slug: string;
  category_name: string;
  author_id: string;
  author_nickname: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  is_liked_by_me: boolean | null;
  is_favorited_by_me: boolean | null;
  allow_comments: boolean;
  show_in_feed: boolean;
}

interface DetailSqlRow extends ListItemSqlRow {
  content_html: string;
  created_at: Date;
  updated_at: Date;
  author_bio: string | null;
}

interface CountRow {
  total: string;
}

interface TagSqlRow {
  slug: string;
  name: string;
}

@Injectable()
export class TypeOrmPostRepository implements PostRepository {
  constructor(
    @InjectRepository(PostOrmEntity)
    private readonly repo: Repository<PostOrmEntity>,
    @InjectRepository(PostTagOrmEntity)
    private readonly postTagRepo: Repository<PostTagOrmEntity>,
  ) {}

  async findById(id: string): Promise<Post | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? PostMapper.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const row = await this.repo.findOne({ where: { slug } });
    return row ? PostMapper.toDomain(row) : null;
  }

  async save(post: Post): Promise<void> {
    const s = post.toSnapshot();
    const orm: PostOrmEntity = Object.assign(new PostOrmEntity(), {
      id: s.id,
      authorId: s.authorId,
      categoryId: s.categoryId,
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt,
      contentHtml: s.contentHtml,
      coverImageUrl: s.coverImageUrl,
      status: s.status,
      publishedAt: s.publishedAt,
      readingMinutes: s.readingMinutes,
      viewsCount: s.viewsCount,
      likesCount: s.likesCount,
      commentsCount: s.commentsCount,
      allowComments: s.allowComments,
      showInFeed: s.showInFeed,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });
    await this.repo.upsert(orm, ['id']);
  }

  async attachTags(postId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) return;
    const rows = tagIds.map((tagId) => {
      const orm = new PostTagOrmEntity();
      orm.postId = postId;
      orm.tagId = tagId;
      return orm;
    });
    await this.postTagRepo
      .createQueryBuilder()
      .insert()
      .into(PostTagOrmEntity)
      .values(rows)
      .orIgnore()
      .execute();
  }

  async detachAllTags(postId: string): Promise<void> {
    await this.postTagRepo.delete({ postId });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async list(filters: PostListFilters): Promise<{ items: PostListItemRow[]; total: number }> {
    const offset = (filters.page - 1) * filters.pageSize;

    const params: unknown[] = [];
    const conditions: string[] = [];

    // When `q` is set, the postgres full-text rank takes priority over the
    // sort param — most relevant matches first, with the requested sort
    // serving as the tiebreaker.
    let qParamIndex: number | undefined;
    if (filters.q) {
      params.push(filters.q);
      qParamIndex = params.length;
      conditions.push(`p.search_tsv @@ plainto_tsquery('simple', $${qParamIndex})`);
    }
    const sortFallback =
      filters.sort === 'popular'
        ? '(p.likes_count * 2 + p.comments_count) DESC, p.published_at DESC NULLS LAST'
        : 'p.published_at DESC NULLS LAST, p.created_at DESC';
    const orderClause = qParamIndex
      ? `ts_rank(p.search_tsv, plainto_tsquery('simple', $${qParamIndex})) DESC, ${sortFallback}`
      : sortFallback;

    if (filters.ownAuthorId) {
      params.push(filters.ownAuthorId);
      conditions.push(`p.author_id = $${params.length}`);
      if (filters.status) {
        params.push(filters.status);
        conditions.push(`p.status = $${params.length}`);
      }
    } else {
      conditions.push(`p.status = 'published'`);
    }

    if (filters.categorySlug) {
      params.push(filters.categorySlug);
      conditions.push(`c.slug = $${params.length}`);
    }
    if (filters.authorNickname) {
      params.push(filters.authorNickname);
      conditions.push(`u.nickname = $${params.length}`);
    }
    let tagJoin = '';
    if (filters.tagSlug) {
      params.push(filters.tagSlug);
      tagJoin = `
        INNER JOIN post_tags pt ON pt.post_id = p.id
        INNER JOIN tags t ON t.id = pt.tag_id AND t.slug = $${params.length}
      `;
    }

    // Author-private feed flag — when listing for the public feed
    // (categorySlug, tagSlug, "all"), exclude posts the author hid.
    // When the requester is browsing their *own* posts (ownAuthorId set)
    // or when fetching by author nickname directly (profile page) we
    // don't apply this filter.
    if (!filters.ownAuthorId && !filters.authorNickname) {
      conditions.push(`p.show_in_feed = true`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `
      SELECT count(*)::text AS total
      FROM posts p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN users u ON u.id = p.author_id
      ${tagJoin}
      ${where}
    `;
    const [countRow] = (await this.repo.query(countSql, params)) as CountRow[];
    const total = Number(countRow?.total ?? 0);

    const reactionJoin = this.reactionJoinSql(filters.currentUserId, params);

    params.push(filters.pageSize);
    const limitParam = params.length;
    params.push(offset);
    const offsetParam = params.length;

    const itemsSql = `
      SELECT
        p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.published_at,
        p.reading_minutes, p.likes_count, p.comments_count, p.status,
        p.allow_comments, p.show_in_feed,
        c.slug AS category_slug, c.name AS category_name,
        u.id AS author_id, u.nickname AS author_nickname,
        u.display_name AS author_display_name, u.avatar_url AS author_avatar_url,
        ${reactionJoin.selectColumns}
      FROM posts p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN users u ON u.id = p.author_id
      ${reactionJoin.joins}
      ${tagJoin}
      ${where}
      ORDER BY ${orderClause}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;
    const rows = (await this.repo.query(itemsSql, params)) as ListItemSqlRow[];

    return { items: rows.map(this.mapItemRow), total };
  }

  async detailBySlug(slug: string, currentUserId?: string): Promise<PostDetailRow | null> {
    const params: unknown[] = [slug];
    const reactionJoin = this.reactionJoinSql(currentUserId, params);

    const sql = `
      SELECT
        p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.published_at,
        p.reading_minutes, p.likes_count, p.comments_count, p.status,
        p.allow_comments, p.show_in_feed,
        p.content_html, p.created_at, p.updated_at,
        c.slug AS category_slug, c.name AS category_name,
        u.id AS author_id, u.nickname AS author_nickname,
        u.display_name AS author_display_name, u.avatar_url AS author_avatar_url,
        u.bio AS author_bio,
        ${reactionJoin.selectColumns}
      FROM posts p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN users u ON u.id = p.author_id
      ${reactionJoin.joins}
      WHERE p.slug = $1
      LIMIT 1
    `;
    const [row] = (await this.repo.query(sql, params)) as DetailSqlRow[];
    if (!row) return null;

    const tagsSql = `
      SELECT t.slug, t.name
      FROM post_tags pt
      INNER JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id = $1
      ORDER BY t.name ASC
    `;
    const tags = (await this.repo.query(tagsSql, [row.id])) as TagSqlRow[];

    const item = this.mapItemRow(row);
    return {
      ...item,
      contentHtml: row.content_html,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      authorBio: row.author_bio,
      tags,
    };
  }

  private reactionJoinSql(
    currentUserId: string | undefined,
    params: unknown[],
  ): { joins: string; selectColumns: string } {
    if (!currentUserId) {
      return {
        joins: '',
        selectColumns: 'FALSE AS is_liked_by_me, FALSE AS is_favorited_by_me',
      };
    }
    params.push(currentUserId);
    const userParam = params.length;
    return {
      joins: `
        LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = $${userParam}
        LEFT JOIN post_favorites pf ON pf.post_id = p.id AND pf.user_id = $${userParam}
      `,
      selectColumns: `
        (pl.user_id IS NOT NULL) AS is_liked_by_me,
        (pf.user_id IS NOT NULL) AS is_favorited_by_me
      `,
    };
  }

  private mapItemRow = (row: ListItemSqlRow): PostListItemRow => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    publishedAt: row.published_at,
    readingMinutes: row.reading_minutes,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    status: row.status,
    category: { slug: row.category_slug, name: row.category_name },
    author: {
      id: row.author_id,
      nickname: row.author_nickname,
      displayName: row.author_display_name,
      avatarUrl: row.author_avatar_url,
    },
    isLikedByMe: row.is_liked_by_me === true,
    isFavoritedByMe: row.is_favorited_by_me === true,
    allowComments: row.allow_comments ?? true,
    showInFeed: row.show_in_feed ?? true,
  });
}
