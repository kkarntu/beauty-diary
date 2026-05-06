import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { CommentCreatedEvent } from './comment-created.event';
import { CommentDeletedEvent } from './comment-deleted.event';
import { CommentUpdatedEvent } from './comment-updated.event';

type CommentChange = CommentCreatedEvent | CommentUpdatedEvent | CommentDeletedEvent;

/**
 * Forwards every comment lifecycle event onto the realtime gateway as
 * a `comment:created` / `comment:updated` / `comment:deleted` push into
 * `post:{id}`. Watchers of the post detail page receive it over the
 * socket and re-fetch the comment list.
 */
@EventsHandler(CommentCreatedEvent, CommentUpdatedEvent, CommentDeletedEvent)
export class CommentCreatedBroadcastHandler implements IEventHandler<CommentChange> {
  constructor(private readonly bus: EventEmitter2) {}

  handle(event: CommentChange): void {
    const wsEvent =
      event instanceof CommentCreatedEvent
        ? 'comment:created'
        : event instanceof CommentUpdatedEvent
          ? 'comment:updated'
          : 'comment:deleted';
    this.bus.emit('realtime.post', {
      postId: event.postId,
      event: wsEvent,
      data: { commentId: event.commentId, postId: event.postId },
    });
  }
}
