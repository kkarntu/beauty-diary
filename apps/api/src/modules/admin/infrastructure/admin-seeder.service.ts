import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { EnvService } from '../../../config/env.service';
import { UserOrmEntity } from '../../users/infrastructure/persistence/user.orm-entity';

@Injectable()
export class AdminSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeederService.name);

  constructor(
    private readonly env: EnvService,
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const seed = this.env.adminSeed;
    if (!seed) return;

    const adminCount = await this.users.count({ where: { role: 'admin' } });
    if (adminCount > 0) return;

    const existing = await this.users.findOne({ where: { email: seed.email } });
    if (existing) {
      existing.role = 'admin';
      await this.users.save(existing);
      this.logger.log(`Promoted existing user ${seed.email} to admin`);
      return;
    }

    const passwordHash = await argon2.hash(seed.password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    const now = new Date();
    await this.users.insert({
      id: uuidv7(),
      email: seed.email.toLowerCase(),
      nickname: seed.nickname,
      passwordHash,
      role: 'admin',
      displayName: null,
      avatarUrl: null,
      bio: null,
      isBlocked: false,
      followersCount: 0,
      followingCount: 0,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    this.logger.log(`Seeded admin user ${seed.email}`);
  }
}
