import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type {
  EmailOutboxRepository,
  EnqueueEmailInput,
  FailedOutboxRow,
  OutboxEmailRow,
} from '../../domain/ports/outbox.repository';
import { EmailOutboxOrmEntity } from './email-outbox.orm-entity';

@Injectable()
export class TypeOrmEmailOutboxRepository implements EmailOutboxRepository {
  constructor(
    @InjectRepository(EmailOutboxOrmEntity)
    private readonly repo: Repository<EmailOutboxOrmEntity>,
  ) {}

  async enqueue(input: EnqueueEmailInput): Promise<void> {
    await this.repo.insert({
      id: uuidv7(),
      toEmail: input.toEmail,
      subject: input.subject,
      html: input.html,
      text: input.text,
      status: 'pending',
      attempts: 0,
      // Default `now()` makes the row immediately due — no need to set explicitly.
    });
  }

  async pickDuePending(limit: number): Promise<OutboxEmailRow[]> {
    const rows = await this.repo.find({
      where: { status: 'pending', nextAttemptAt: LessThanOrEqual(new Date()) },
      order: { nextAttemptAt: 'ASC' },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      toEmail: r.toEmail,
      subject: r.subject,
      html: r.html,
      text: r.text,
      attempts: r.attempts,
    }));
  }

  async markSent(id: string): Promise<void> {
    await this.repo.update({ id }, { status: 'sent', sentAt: new Date() });
  }

  async scheduleRetry(id: string, error: string, nextAttemptAt: Date): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(EmailOutboxOrmEntity)
      .set({
        // Stays pending — the cron picks it up again once nextAttemptAt is reached.
        status: 'pending',
        lastError: error.slice(0, 500),
        attempts: () => 'attempts + 1',
        nextAttemptAt,
      })
      .where('id = :id', { id })
      .execute();
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(EmailOutboxOrmEntity)
      .set({
        status: 'failed',
        lastError: error.slice(0, 500),
        attempts: () => 'attempts + 1',
      })
      .where('id = :id', { id })
      .execute();
  }

  async listFailed(
    limit: number,
    offset: number,
  ): Promise<{ items: FailedOutboxRow[]; total: number }> {
    const [rows, total] = await this.repo.findAndCount({
      where: { status: 'failed' },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return {
      total,
      items: rows.map((r) => ({
        id: r.id,
        toEmail: r.toEmail,
        subject: r.subject,
        attempts: r.attempts,
        lastError: r.lastError,
        createdAt: r.createdAt,
      })),
    };
  }

  async requeue(id: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(EmailOutboxOrmEntity)
      .set({
        status: 'pending',
        attempts: 0,
        lastError: null,
        nextAttemptAt: new Date(),
      })
      .where('id = :id AND status = :status', { id, status: 'failed' })
      .execute();
    return (result.affected ?? 0) > 0;
  }
}
