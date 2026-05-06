import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  CATEGORY_REPOSITORY,
  type CategoryRepository,
} from '../../../categories/domain/ports/category.repository';
import { HTML_SANITIZER, type HtmlSanitizer } from '../../domain/ports/html-sanitizer';
import {
  CategoryNotFoundError,
  NotPostAuthorError,
  PostNotFoundError,
} from '../../domain/post.errors';
import { POST_REPOSITORY, type PostRepository } from '../../domain/ports/post.repository';
import { TAG_REPOSITORY, type TagRepository } from '../../domain/ports/tag.repository';
import { UpdatePostCommand } from './update-post.command';

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand, void> {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(TAG_REPOSITORY) private readonly tags: TagRepository,
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository,
    @Inject(HTML_SANITIZER) private readonly sanitizer: HtmlSanitizer,
  ) {}

  async execute(cmd: UpdatePostCommand): Promise<void> {
    const post = await this.posts.findById(cmd.postId);
    if (!post) {
      throw new PostNotFoundError();
    }
    if (!post.isOwnedBy(cmd.actorId) && cmd.actorRole !== 'admin') {
      throw new NotPostAuthorError();
    }

    if (cmd.input.categoryId) {
      const category = await this.categories.findById(cmd.input.categoryId);
      if (!category) {
        throw new CategoryNotFoundError();
      }
    }

    const sanitizedHtml =
      cmd.input.contentHtml !== undefined
        ? this.sanitizer.sanitize(cmd.input.contentHtml)
        : undefined;

    post.update({
      title: cmd.input.title,
      excerpt: cmd.input.excerpt,
      contentHtml: sanitizedHtml,
      coverImageUrl: cmd.input.coverImageUrl,
      categoryId: cmd.input.categoryId,
      allowComments: cmd.input.allowComments,
      showInFeed: cmd.input.showInFeed,
    });
    await this.posts.save(post);

    if (cmd.input.tagSlugs !== undefined) {
      await this.posts.detachAllTags(post.id);
      if (cmd.input.tagSlugs.length > 0) {
        const tags = await this.tags.findOrCreateMany(cmd.input.tagSlugs);
        await this.posts.attachTags(
          post.id,
          tags.map((t) => t.id),
        );
      }
    }
  }
}
