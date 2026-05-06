import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { NotificationType } from '@beauty-diary/shared';
import {
  COMMENT_REPOSITORY,
  type CommentRepository,
} from '../../../comments/domain/ports/comment.repository';
import { CommentCreatedEvent } from '../../../comments/application/events/comment-created.event';
import { POST_REPOSITORY, type PostRepository } from '../../../posts/domain/ports/post.repository';
import { USER_REPOSITORY, type UserRepository } from '../../../users/domain/ports/user.repository';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../../domain/ports/notification.repository';
import {
  EMAIL_OUTBOX_REPOSITORY,
  type EmailOutboxRepository,
} from '../../domain/ports/outbox.repository';
import {
  NOTIFICATION_PREFERENCES_REPOSITORY,
  type NotificationPreferencesRepository,
} from '../../domain/ports/preferences.repository';

/**
 * When somebody comments on a post that isn't their own:
 *   1. Persists an in-app notification row for the post author.
 *   2. Pushes it live via the realtime gateway (`notification:created`
 *      into `user:{authorId}` room).
 *   3. Enqueues a transactional email — gated by the recipient's prefs.
 *
 * Failures here must not bubble back into the command path that emitted
 * the event, so the body is wrapped in a try/catch.
 */
@EventsHandler(CommentCreatedEvent)
export class CommentCreatedNotifyHandler implements IEventHandler<CommentCreatedEvent> {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(COMMENT_REPOSITORY) private readonly comments: CommentRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(EMAIL_OUTBOX_REPOSITORY) private readonly outbox: EmailOutboxRepository,
    @Inject(NOTIFICATION_PREFERENCES_REPOSITORY)
    private readonly prefs: NotificationPreferencesRepository,
    private readonly bus: EventEmitter2,
  ) {}

  async handle(event: CommentCreatedEvent): Promise<void> {
    try {
      const post = await this.posts.findById(event.postId);
      if (!post) return;
      const postSnap = post.toSnapshot();
      if (postSnap.authorId === event.authorId) return;

      const recipientPrefs = await this.prefs.findByUserId(postSnap.authorId);
      if (!recipientPrefs.newComment) return;

      const author = await this.users.findById(postSnap.authorId);
      const commenter = await this.users.findById(event.authorId);
      const comment = await this.comments.findById(event.commentId);
      if (!author || !commenter || !comment) return;

      const commenterSnap = commenter.toSnapshot();
      const commentSnap = comment.toSnapshot();
      const commenterName = commenterSnap.displayName ?? commenterSnap.nickname;

      const payload = {
        commentId: commentSnap.id,
        commentExcerpt: commentSnap.content.slice(0, 140),
        post: { id: postSnap.id, slug: postSnap.slug, title: postSnap.title },
        actor: {
          id: commenterSnap.id,
          nickname: commenterSnap.nickname,
          displayName: commenterSnap.displayName,
          avatarUrl: commenterSnap.avatarUrl,
        },
      };

      // 1) Persist the in-app notification row.
      const notification = await this.notifications.create({
        userId: postSnap.authorId,
        type: NotificationType.COMMENT_CREATED,
        payload,
      });

      // 2) Push to any open socket for that user.
      this.bus.emit('realtime.user', {
        userId: postSnap.authorId,
        event: 'notification:created',
        data: {
          id: notification.id,
          type: notification.type,
          payload: notification.payload,
          readAt: null,
          createdAt: notification.createdAt.toISOString(),
        },
      });

      // 3) Email — same data, rendered HTML/text.
      const subject = `${commenterName} commented on "${postSnap.title}"`;
      const text = `${commenterName} just commented on your post "${postSnap.title}":\n\n${commentSnap.content}\n\nOpen it: /posts/${postSnap.slug}`;
      const html = `
        <p><strong>${escapeHtml(commenterName)}</strong> commented on your post
          <em>${escapeHtml(postSnap.title)}</em>:</p>
        <blockquote>${escapeHtml(commentSnap.content)}</blockquote>
        <p><a href="/posts/${escapeHtml(postSnap.slug)}">Open the post</a></p>
      `.trim();

      await this.outbox.enqueue({ toEmail: author.email, subject, text, html });
    } catch {
      // Never let a notification failure crash the originating command.
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
