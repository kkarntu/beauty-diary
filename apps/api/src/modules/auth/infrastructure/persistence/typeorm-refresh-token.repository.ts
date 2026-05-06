import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../../domain/refresh-token.entity';
import type { RefreshTokenRepository } from '../../domain/ports/refresh-token.repository';
import { RefreshTokenOrmEntity } from './refresh-token.orm-entity';

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async save(token: RefreshToken): Promise<void> {
    const s = token.toSnapshot();
    await this.repo.upsert(
      {
        id: s.id,
        userId: s.userId,
        tokenHash: s.tokenHash,
        userAgent: s.userAgent,
        ip: s.ip,
        expiresAt: s.expiresAt,
        revokedAt: s.revokedAt,
        replacedBy: s.replacedBy,
        createdAt: s.createdAt,
      },
      ['id'],
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(RefreshTokenOrmEntity)
      .set({ revokedAt: () => 'now()' })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repo.delete({ expiresAt: LessThan(new Date()) });
    return result.affected ?? 0;
  }

  private toDomain(row: RefreshTokenOrmEntity): RefreshToken {
    return RefreshToken.rehydrate({
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      userAgent: row.userAgent,
      ip: row.ip,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      replacedBy: row.replacedBy,
      createdAt: row.createdAt,
    });
  }
}
