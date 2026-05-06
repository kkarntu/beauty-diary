import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { NotificationType } from '@beauty-diary/shared';
import { POST_REPOSITORY, type PostRepository } from '../../../posts/domain/ports/post.repository';
import { PostLikedEvent } from '../../../reactions/application/events/post-liked.event';
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
 * When somebody likes a post that isn't their own:
 *   1. In-app notification row for the post author.
 *   2. Real-time push (`notification:created` → `user:{authorId}`).
 *   3. Email — both gated on the recipient's `newLike` toggle.
 *
 * Self-likes are filtered here so the reactions module stays unaware of
 * the notifications domain.
 */
@EventsHandler(PostLikedEvent)
export class PostLikedNotifyHandler implements IEventHandler<PostLikedEvent> {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(EMAIL_OUTBOX_REPOSITORY) private readonly outbox: EmailOutboxRepository,
    @Inject(NOTIFICATION_PREFERENCES_REPOSITORY)
    private readonly prefs: NotificationPreferencesRepository,
    private readonly bus: EventEmitter2,
  ) {}

  async handle(event: PostLikedEvent): Promise<void> {
    try {
      const post = await this.posts.findById(event.postId);
      if (!post) return;
      const postSnap = post.toSnapshot();
      if (postSnap.authorId === event.userId) return;

      const recipientPrefs = await this.prefs.findByUserId(postSnap.authorId);
      if (!recipientPrefs.newLike) return;

      const author = await this.users.findById(postSnap.authorId);
      const liker = await this.users.findById(event.userId);
      if (!author || !liker) return;

      const likerSnap = liker.toSnapshot();
      const likerName = likerSnap.displayName ?? likerSnap.nickname;

      const payload = {
        post: { id: postSnap.id, slug: postSnap.slug, title: postSnap.title },
        actor: {
          id: likerSnap.id,
          nickname: likerSnap.nickname,
          displayName: likerSnap.displayName,
          avatarUrl: likerSnap.avatarUrl,
        },
      };

      const notification = await this.notifications.create({
        userId: postSnap.authorId,
        type: NotificationType.POST_LIKED,
        payload,
      });

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

      const subject = `${likerName} liked "${postSnap.title}"`;
      const text = `${likerName} just liked your post "${postSnap.title}". Open it: /posts/${postSnap.slug}`;
      const html = `
        <p><strong>${escapeHtml(likerName)}</strong> liked your post
          <em>${escapeHtml(postSnap.title)}</em>.</p>
        <p><a href="/posts/${escapeHtml(postSnap.slug)}">Open the post</a></p>
      `.trim();

      await this.outbox.enqueue({ toEmail: author.email, subject, text, html });
    } catch {
      // Notifications must not crash the originating command.
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
