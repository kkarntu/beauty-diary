import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetToken } from '../../domain/password-reset-token.entity';
import type { PasswordResetTokenRepository } from '../../domain/ports/password-reset-token.repository';
import { PasswordResetTokenOrmEntity } from './password-reset-token.orm-entity';

@Injectable()
export class TypeOrmPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenOrmEntity)
    private readonly repo: Repository<PasswordResetTokenOrmEntity>,
  ) {}

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await this.repo.findOne({ where: { tokenHash } });
    return row ? this.toDomain(row) : null;
  }

  async save(token: PasswordResetToken): Promise<void> {
    const s = token.toSnapshot();
    await this.repo.upsert(
      {
        id: s.id,
        userId: s.userId,
        tokenHash: s.tokenHash,
        expiresAt: s.expiresAt,
        usedAt: s.usedAt,
        createdAt: s.createdAt,
      },
      ['id'],
    );
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(PasswordResetTokenOrmEntity)
      .set({ usedAt: () => 'now()' })
      .where('user_id = :userId AND used_at IS NULL', { userId })
      .execute();
  }

  private toDomain(row: PasswordResetTokenOrmEntity): PasswordResetToken {
    return PasswordResetToken.rehydrate({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    });
  }
}
