import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { v7 as uuidv7 } from 'uuid';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../../categories/domain/ports/category.repository';
import { HTML_SANITIZER, type HtmlSanitizer } from '../../domain/ports/html-sanitizer';
import { CategoryNotFoundError } from '../../domain/post.errors';
import { POST_REPOSITORY, type PostRepository } from '../../domain/ports/post.repository';
import { TAG_REPOSITORY, type TagRepository } from '../../domain/ports/tag.repository';
import { Post } from '../../domain/post.entity';
import { generateUniquePostSlug } from '../../infrastructure/slug.util';
import { CreatePostCommand, type CreatePostResult } from './create-post.command';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand, CreatePostResult> {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(TAG_REPOSITORY) private readonly tags: TagRepository,
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    @Inject(HTML_SANITIZER) private readonly sanitizer: HtmlSanitizer,
  ) {}

  async execute(cmd: CreatePostCommand): Promise<CreatePostResult> {
    const category = await this.categories.findById(cmd.categoryId);
    if (!category) {
      throw new CategoryNotFoundError();
    }

    const slug = await generateUniquePostSlug(cmd.title, this.posts);
    const safeHtml = this.sanitizer.sanitize(cmd.contentHtml);

    const post = Post.create({
      id: uuidv7(),
      authorId: cmd.authorId,
      categoryId: cmd.categoryId,
      slug,
      title: cmd.title,
      excerpt: cmd.excerpt,
      contentHtml: safeHtml,
      coverImageUrl: cmd.coverImageUrl,
      status: cmd.status,
      allowComments: cmd.allowComments,
      showInFeed: cmd.showInFeed,
    });

    await this.posts.save(post);

    if (cmd.tagSlugs.length > 0) {
      const tags = await this.tags.findOrCreateMany(cmd.tagSlugs);
      await this.posts.attachTags(
        post.id,
        tags.map((t) => t.id),
      );
    }

    return { id: post.id, slug: post.slug };
  }
}
