import { Inject } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import {
  NEWSLETTER_SUBSCRIBER_REPOSITORY,
  type NewsletterSubscriberRepository,
} from '../../domain/ports/subscriber.repository';
import { SubscribeNewsletterCommand } from './subscribe.command';

@CommandHandler(SubscribeNewsletterCommand)
export class SubscribeNewsletterHandler implements ICommandHandler<
  SubscribeNewsletterCommand,
  void
> {
  constructor(
    @Inject(NEWSLETTER_SUBSCRIBER_REPOSITORY)
    private readonly subscribers: NewsletterSubscriberRepository,
  ) {}

  async execute(cmd: SubscribeNewsletterCommand): Promise<void> {
    await this.subscribers.subscribe(cmd.email.trim().toLowerCase());
  }
}
