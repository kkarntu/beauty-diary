import { EventBus } from '@nestjs/cqrs';
import { PostStatus } from '@beauty-diary/shared';
import { Post } from '../../../posts/domain/post.entity';
import type { PostRepository } from '../../../posts/domain/ports/post.repository';
import type { CommentRepository } from '../../domain/ports/comment.repository';
import { CommentCreatedEvent } from '../events/comment-created.event';
import { CreateCommentCommand } from './create-comment.command';
import { CreateCommentHandler } from './create-comment.handler';

function makePublishedPost(): Post {
  return Post.rehydrate({
    id: '00000000-0000-7000-8000-000000000001',
    authorId: '00000000-0000-7000-8000-0000000000aa',
    categoryId: '00000000-0000-7000-8000-0000000000bb',
    slug: 'hello-world',
    title: 'Hello world',
    excerpt: null,
    contentHtml: '<p>body</p>',
    coverImageUrl: null,
    status: PostStatus.PUBLISHED,
    publishedAt: new Date(),
    readingMinutes: 1,
    viewsCount: 0,
    likesCount: 0,
    commentsCount: 0,
    allowComments: true,
    showInFeed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makePostWithCommentsDisabled(): Post {
  return Post.rehydrate({
    id: '00000000-0000-7000-8000-000000000099',
    authorId: '00000000-0000-7000-8000-0000000000aa',
    categoryId: '00000000-0000-7000-8000-0000000000bb',
    slug: 'no-comments',
    title: 'No comments',
    excerpt: null,
    contentHtml: '<p>body</p>',
    coverImageUrl: null,
    status: PostStatus.PUBLISHED,
    publishedAt: new Date(),
    readingMinutes: 1,
    viewsCount: 0,
    likesCount: 0,
    commentsCount: 0,
    allowComments: false,
    showInFeed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CreateCommentHandler', () => {
  it('publishes CommentCreatedEvent after persisting the comment', async () => {
    const post = makePublishedPost();

    const comments: Pick<CommentRepository, 'save' | 'findById'> = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    };
    const posts: Pick<PostRepository, 'findById' | 'save'> = {
      findById: jest.fn().mockResolvedValue(post),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const eventBus = { publish: jest.fn() } as unknown as EventBus;

    const handler = new CreateCommentHandler(
      comments as CommentRepository,
      posts as PostRepository,
      eventBus,
    );

    const authorId = '00000000-0000-7000-8000-0000000000cc';
    const result = await handler.execute(
      new CreateCommentCommand(authorId, post.id, null, 'Nice post!'),
    );

    expect(comments.save).toHaveBeenCalledTimes(1);
    expect(posts.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);

    const published = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(published).toBeInstanceOf(CommentCreatedEvent);
    expect(published.commentId).toBe(result.id);
    expect(published.postId).toBe(post.id);
    expect(published.authorId).toBe(authorId);
  });

  it('rejects when the post has comments disabled', async () => {
    const post = makePostWithCommentsDisabled();
    const comments: Pick<CommentRepository, 'save' | 'findById'> = {
      save: jest.fn(),
      findById: jest.fn(),
    };
    const posts: Pick<PostRepository, 'findById' | 'save'> = {
      findById: jest.fn().mockResolvedValue(post),
      save: jest.fn(),
    };
    const eventBus = { publish: jest.fn() } as unknown as EventBus;
    const handler = new CreateCommentHandler(
      comments as CommentRepository,
      posts as PostRepository,
      eventBus,
    );

    await expect(
      handler.execute(
        new CreateCommentCommand(
          '00000000-0000-7000-8000-0000000000cc',
          post.id,
          null,
          'hello',
        ),
      ),
    ).rejects.toMatchObject({ code: 'COMMENTS_DISABLED' });
    expect(comments.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
