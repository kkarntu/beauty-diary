import { Post } from '../../domain/post.entity';
import { PostOrmEntity } from '../persistence/post.orm-entity';

export class PostMapper {
  static toDomain(orm: PostOrmEntity): Post {
    return Post.rehydrate({
      id: orm.id,
      authorId: orm.authorId,
      categoryId: orm.categoryId,
      slug: orm.slug,
      title: orm.title,
      excerpt: orm.excerpt,
      contentHtml: orm.contentHtml,
      coverImageUrl: orm.coverImageUrl,
      status: orm.status,
      publishedAt: orm.publishedAt,
      readingMinutes: orm.readingMinutes,
      viewsCount: orm.viewsCount,
      likesCount: orm.likesCount,
      commentsCount: orm.commentsCount,
      allowComments: orm.allowComments ?? true,
      showInFeed: orm.showInFeed ?? true,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}
