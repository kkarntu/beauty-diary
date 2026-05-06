import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { User } from '../../domain/user.entity';
import type { UserRepository } from '../../domain/ports/user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { email } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByNickname(nickname: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { nickname } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    // Use upsert (INSERT ... ON CONFLICT DO UPDATE) so the same path handles
    // both register and updateProfile. With @PrimaryColumn + populated date
    // fields, TypeORM's plain `save()` can misclassify a new entity as
    // existing and emit an UPDATE that affects zero rows.
    await this.repo.upsert(UserMapper.toOrm(user), ['id']);
  }
}
