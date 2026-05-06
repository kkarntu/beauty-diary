import { Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { NotificationType } from '@beauty-diary/shared';
import { UserFollowedEvent } from '../../../follows/application/events/user-followed.event';
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

@EventsHandler(UserFollowedEvent)
export class UserFollowedNotifyHandler implements IEventHandler<UserFollowedEvent> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(EMAIL_OUTBOX_REPOSITORY) private readonly outbox: EmailOutboxRepository,
    @Inject(NOTIFICATION_PREFERENCES_REPOSITORY)
    private readonly prefs: NotificationPreferencesRepository,
    private readonly bus: EventEmitter2,
  ) {}

  async handle(event: UserFollowedEvent): Promise<void> {
    try {
      const recipientPrefs = await this.prefs.findByUserId(event.followeeId);
      if (!recipientPrefs.newFollower) return;

      const followee = await this.users.findById(event.followeeId);
      const follower = await this.users.findById(event.followerId);
      if (!followee || !follower) return;

      const followerSnap = follower.toSnapshot();
      const followerName = followerSnap.displayName ?? followerSnap.nickname;

      const payload = {
        actor: {
          id: followerSnap.id,
          nickname: followerSnap.nickname,
          displayName: followerSnap.displayName,
          avatarUrl: followerSnap.avatarUrl,
        },
      };

      const notification = await this.notifications.create({
        userId: event.followeeId,
        type: NotificationType.USER_FOLLOWED,
        payload,
      });

      this.bus.emit('realtime.user', {
        userId: event.followeeId,
        event: 'notification:created',
        data: {
          id: notification.id,
          type: notification.type,
          payload: notification.payload,
          readAt: null,
          createdAt: notification.createdAt.toISOString(),
        },
      });

      const subject = `${followerName} started following you on Beauty Diary`;
      const text = `${followerName} (@${follower.nickname}) just followed you. Open their profile: /users/${follower.nickname}`;
      const html = `
        <p><strong>${escapeHtml(followerName)}</strong> (@${escapeHtml(follower.nickname)}) just followed you on Beauty Diary.</p>
        <p><a href="/users/${escapeHtml(follower.nickname)}">View profile</a></p>
      `.trim();

      await this.outbox.enqueue({ toEmail: followee.email, subject, text, html });
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
