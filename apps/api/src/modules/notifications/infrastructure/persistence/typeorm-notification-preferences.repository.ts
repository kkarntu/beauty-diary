import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DEFAULT_PREFERENCES,
  type NotificationPreferences,
  type NotificationPreferencesRepository,
} from '../../domain/ports/preferences.repository';
import { NotificationPreferencesOrmEntity } from './notification-preferences.orm-entity';

@Injectable()
export class TypeOrmNotificationPreferencesRepository implements NotificationPreferencesRepository {
  constructor(
    @InjectRepository(NotificationPreferencesOrmEntity)
    private readonly repo: Repository<NotificationPreferencesOrmEntity>,
  ) {}

  async findByUserId(userId: string): Promise<NotificationPreferences> {
    const row = await this.repo.findOne({ where: { userId } });
    if (!row) return DEFAULT_PREFERENCES;
    return {
      newFollower: row.newFollower,
      newComment: row.newComment,
      newLike: row.newLike,
      newsletter: row.newsletter,
    };
  }

  async upsert(
    userId: string,
    patch: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = await this.findByUserId(userId);
    const merged = { ...current, ...patch };
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(NotificationPreferencesOrmEntity)
      .values({ userId, ...merged })
      .orUpdate(
        ['new_follower', 'new_comment', 'new_like', 'newsletter', 'updated_at'],
        ['user_id'],
      )
      .execute();
    return merged;
  }
}
