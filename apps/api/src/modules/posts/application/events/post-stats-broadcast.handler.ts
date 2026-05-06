import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { CommentCreatedEvent } from '../../../comments/application/events/comment-created.event';
import { PostLikedEvent } from '../../../reactions/application/events/post-liked.event';
import { PostUnlikedEvent } from '../../../reactions/application/events/post-unliked.event';
import { POST_REPOSITORY, type PostRepository } from '../../domain/ports/post.repository';

type StatsTrigger = PostLikedEvent | PostUnlikedEvent | CommentCreatedEvent;

/**
 * Pushes the post's denormalised counts (`likesCount` / `commentsCount`)
 * into the `post:{id}` realtime room whenever a like / unlike / comment
 * happens. Feed cards subscribe to this so the badges update without
 * a page refresh.
 *
 * Reads counts back from the post row — they're maintained by Postgres
 * triggers in the same transaction as the underlying mutation, so this
 * always reads the post-mutation value.
 */
@EventsHandler(PostLikedEvent, PostUnlikedEvent, CommentCreatedEvent)
export class PostStatsBroadcastHandler implements IEventHandler<StatsTrigger> {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    private readonly bus: EventEmitter2,
  ) {}

  async handle(event: StatsTrigger): Promise<void> {
    const post = await this.posts.findById(event.postId);
    if (!post) return;
    const snap = post.toSnapshot();
    this.bus.emit('realtime.post', {
      postId: snap.id,
      event: 'post:stats',
      data: {
        postId: snap.id,
        likesCount: snap.likesCount,
        commentsCount: snap.commentsCount,
      },
    });
  }
}
