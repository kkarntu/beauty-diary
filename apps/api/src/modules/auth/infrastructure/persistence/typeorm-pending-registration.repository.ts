import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  PendingRegistrationRecord,
  PendingRegistrationRepository,
  UpsertPendingRegistrationInput,
} from '../../domain/ports/pending-registration.repository';
import { PendingRegistrationOrmEntity } from './pending-registration.orm-entity';

@Injectable()
export class TypeOrmPendingRegistrationRepository implements PendingRegistrationRepository {
  constructor(
    @InjectRepository(PendingRegistrationOrmEntity)
    private readonly repo: Repository<PendingRegistrationOrmEntity>,
  ) {}

  async upsert(input: UpsertPendingRegistrationInput): Promise<void> {
    await this.repo.upsert(
      {
        id: input.id,
        email: input.email,
        nickname: input.nickname,
        passwordHash: input.passwordHash,
        otpHash: input.otpHash,
        expiresAt: input.expiresAt,
        attempts: 0,
        lastResentAt: null,
      },
      { conflictPaths: ['email'], skipUpdateIfNoValuesChanged: false },
    );
  }

  async findByEmail(email: string): Promise<PendingRegistrationRecord | null> {
    const row = await this.repo.findOne({ where: { email } });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      nickname: row.nickname,
      passwordHash: row.passwordHash,
      otpHash: row.otpHash,
      expiresAt: row.expiresAt,
      attempts: row.attempts,
      lastResentAt: row.lastResentAt,
      createdAt: row.createdAt,
    };
  }

  async rotateOtp(email: string, otpHash: string, expiresAt: Date, now: Date): Promise<void> {
    await this.repo.update({ email }, { otpHash, expiresAt, lastResentAt: now, attempts: 0 });
  }

  async incrementAttempts(email: string): Promise<void> {
    await this.repo.increment({ email }, 'attempts', 1);
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.repo.delete({ email });
  }
}
