import { EventBus } from '@nestjs/cqrs';
import { PostStatus } from '@beauty-diary/shared';
import { Post } from '../../../posts/domain/post.entity';
import type { PostRepository } from '../../../posts/domain/ports/post.repository';
import type { ReactionRepository } from '../../domain/ports/reaction.repository';
import { PostLikedEvent } from '../events/post-liked.event';
import { LikePostCommand } from './like-post.command';
import { LikePostHandler } from './reaction.handlers';

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

describe('LikePostHandler', () => {
  function setup({ insertedNew = true } = {}) {
    const post = makePublishedPost();
    const reactions = {
      like: jest.fn().mockResolvedValue(insertedNew),
    } as unknown as ReactionRepository;
    const posts = {
      findById: jest.fn().mockResolvedValue(post),
    } as unknown as PostRepository;
    const eventBus = { publish: jest.fn() } as unknown as EventBus;
    const handler = new LikePostHandler(reactions, posts, eventBus);
    return { handler, reactions, eventBus, post };
  }

  it('publishes PostLikedEvent on a fresh like', async () => {
    const { handler, eventBus, post } = setup();
    const userId = '00000000-0000-7000-8000-0000000000cc';
    await handler.execute(new LikePostCommand(userId, post.id));
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const evt = (eventBus.publish as jest.Mock).mock.calls[0][0];
    expect(evt).toBeInstanceOf(PostLikedEvent);
    expect(evt.userId).toBe(userId);
    expect(evt.postId).toBe(post.id);
  });

  it('does NOT publish when the like is a duplicate', async () => {
    const { handler, eventBus, post } = setup({ insertedNew: false });
    await handler.execute(
      new LikePostCommand('00000000-0000-7000-8000-0000000000cc', post.id),
    );
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
