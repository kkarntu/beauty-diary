import { Inject } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { POST_REPOSITORY, type PostRepository } from '../../domain/ports/post.repository';
import { PostNotFoundError } from '../../domain/post.errors';
import {
  GetPostBySlugQuery,
  type GetPostBySlugResult,
} from './get-post-by-slug.query';

@QueryHandler(GetPostBySlugQuery)
export class GetPostBySlugHandler
  implements IQueryHandler<GetPostBySlugQuery, GetPostBySlugResult>
{
  constructor(@Inject(POST_REPOSITORY) private readonly posts: PostRepository) {}

  async execute(query: GetPostBySlugQuery): Promise<GetPostBySlugResult> {
    const row = await this.posts.detailBySlug(query.slug, query.currentUserId);
    if (!row) throw new PostNotFoundError();
    // Drafts and archived posts are only visible to their author. Anyone
    // else (including anonymous viewers) sees a generic 404.
    const viewerOwnsPost =
      query.currentUserId !== undefined && row.author.id === query.currentUserId;
    if (row.status !== 'published' && !viewerOwnsPost) {
      throw new PostNotFoundError();
    }
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      contentHtml: row.contentHtml,
      coverImageUrl: row.coverImageUrl,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      readingMinutes: row.readingMinutes,
      likesCount: row.likesCount,
      commentsCount: row.commentsCount,
      status: row.status,
      category: row.category,
      tags: row.tags,
      author: {
        id: row.author.id,
        nickname: row.author.nickname,
        displayName: row.author.displayName,
        avatarUrl: row.author.avatarUrl,
        bio: row.authorBio,
      },
      isLikedByMe: row.isLikedByMe,
      isFavoritedByMe: row.isFavoritedByMe,
      allowComments: row.allowComments,
      showInFeed: row.showInFeed,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
