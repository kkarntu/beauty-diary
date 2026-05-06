import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { NewsletterSubscriberRepository } from '../../domain/ports/subscriber.repository';
import { NewsletterSubscriberOrmEntity } from './newsletter-subscriber.orm-entity';

@Injectable()
export class TypeOrmNewsletterSubscriberRepository implements NewsletterSubscriberRepository {
  constructor(
    @InjectRepository(NewsletterSubscriberOrmEntity)
    private readonly repo: Repository<NewsletterSubscriberOrmEntity>,
  ) {}

  async subscribe(email: string): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .insert()
      .into(NewsletterSubscriberOrmEntity)
      .values({ id: uuidv7(), email: email.toLowerCase() })
      .orIgnore()
      .execute();
    return (result.identifiers?.length ?? 0) > 0;
  }
}
