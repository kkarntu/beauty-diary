import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscribeNewsletterHandler } from './application/commands/subscribe.handler';
import { NEWSLETTER_SUBSCRIBER_REPOSITORY } from './domain/ports/subscriber.repository';
import { NewsletterSubscriberOrmEntity } from './infrastructure/persistence/newsletter-subscriber.orm-entity';
import { TypeOrmNewsletterSubscriberRepository } from './infrastructure/persistence/typeorm-newsletter-subscriber.repository';
import { NewsletterController } from './presentation/newsletter.controller';

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([NewsletterSubscriberOrmEntity])],
  controllers: [NewsletterController],
  providers: [
    SubscribeNewsletterHandler,
    {
      provide: NEWSLETTER_SUBSCRIBER_REPOSITORY,
      useClass: TypeOrmNewsletterSubscriberRepository,
    },
  ],
})
export class NewsletterModule {}
