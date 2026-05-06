import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type {
  CreateNotificationInput,
  NotificationRepository,
  NotificationRow,
} from '../../domain/ports/notification.repository';
import { NotificationOrmEntity } from './notification.orm-entity';

@Injectable()
export class TypeOrmNotificationRepository implements NotificationRepository {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly repo: Repository<NotificationOrmEntity>,
  ) {}

  async create(input: CreateNotificationInput): Promise<NotificationRow> {
    const id = uuidv7();
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(NotificationOrmEntity)
      .values({
        id,
        userId: input.userId,
        type: input.type,
        payload: () => `'${JSON.stringify(input.payload).replace(/'/g, "''")}'::jsonb`,
        readAt: null,
      })
      .execute();
    const saved = await this.repo.findOneOrFail({ where: { id } });
    return mapRow(saved);
  }

  async listByUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: NotificationRow[]; total: number; unreadCount: number }> {
    const [rows, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    const unreadCount = await this.repo.count({
      where: { userId, readAt: IsNull() },
    });
    return { items: rows.map(mapRow), total, unreadCount };
  }

  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(NotificationOrmEntity)
      .set({ readAt: new Date() })
      .where('id = :id AND user_id = :userId AND read_at IS NULL', {
        id: notificationId,
        userId,
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(NotificationOrmEntity)
      .set({ readAt: new Date() })
      .where('user_id = :userId AND read_at IS NULL', { userId })
      .execute();
  }

  async unreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, readAt: IsNull() } });
  }
}

function mapRow(orm: NotificationOrmEntity): NotificationRow {
  return {
    id: orm.id,
    userId: orm.userId,
    type: orm.type,
    payload: orm.payload ?? {},
    readAt: orm.readAt,
    createdAt: orm.createdAt,
  };
}
