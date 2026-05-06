import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostStatus, type PostListItemDto } from '@beauty-diary/shared';
import {
  REACTION_REPOSITORY,
  type ReactionRepository,
} from '../../domain/ports/reaction.repository';
import { ListFavoritesQuery, type ListFavoritesResult } from './list-favorites.query';

@QueryHandler(ListFavoritesQuery)
export class ListFavoritesHandler implements IQueryHandler<ListFavoritesQuery, ListFavoritesResult> {
  constructor(@Inject(REACTION_REPOSITORY) private readonly reactions: ReactionRepository) {}

  async execute(query: ListFavoritesQuery): Promise<ListFavoritesResult> {
    const { items, total } = await this.reactions.listFavoritesByUser({
      userId: query.userId,
      page: query.page,
      pageSize: query.pageSize,
    });

    const mapped: PostListItemDto[] = items.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      coverImageUrl: row.coverImageUrl,
      // Favorites SQL only joins posts with status = 'published'.
      status: PostStatus.PUBLISHED,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      readingMinutes: row.readingMinutes,
      likesCount: row.likesCount,
      commentsCount: row.commentsCount,
      category: row.category,
      author: row.author,
      isLikedByMe: row.isLikedByMe,
      // These rows ARE the user's favorites — the flag is true by construction.
      isFavoritedByMe: true,
      // Favorites SQL only joins published posts; defaults are correct.
      allowComments: true,
      showInFeed: true,
    }));

    return { items: mapped, total, page: query.page, pageSize: query.pageSize };
  }
}
