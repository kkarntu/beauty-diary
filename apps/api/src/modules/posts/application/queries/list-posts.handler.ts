import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { PostListItemDto } from '@beauty-diary/shared';
import { POST_REPOSITORY, type PostRepository } from '../../domain/ports/post.repository';
import { ListPostsQuery, type ListPostsResult } from './list-posts.query';

@QueryHandler(ListPostsQuery)
export class ListPostsHandler implements IQueryHandler<ListPostsQuery, ListPostsResult> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: PostRepository) {}

  async execute(query: ListPostsQuery): Promise<ListPostsResult> {
    const { items, total } = await this.posts.list({
      page: query.page,
      pageSize: query.pageSize,
      sort: query.sort,
      categorySlug: query.categorySlug,
      tagSlug: query.tagSlug,
      authorNickname: query.authorNickname,
      currentUserId: query.currentUserId,
      q: query.q,
      ownAuthorId: query.ownAuthorId,
      status: query.status,
    });

    const mapped: PostListItemDto[] = items.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      coverImageUrl: row.coverImageUrl,
      status: row.status,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      readingMinutes: row.readingMinutes,
      likesCount: row.likesCount,
      commentsCount: row.commentsCount,
      category: row.category,
      author: {
        id: row.author.id,
        nickname: row.author.nickname,
        avatarUrl: row.author.avatarUrl,
      },
      isLikedByMe: row.isLikedByMe,
      isFavoritedByMe: row.isFavoritedByMe,
      allowComments: row.allowComments,
      showInFeed: row.showInFeed,
    }));

    return {
      items: mapped,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}
