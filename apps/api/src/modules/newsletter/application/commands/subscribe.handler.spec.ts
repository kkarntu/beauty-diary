import type { NewsletterSubscriberRepository } from '../../domain/ports/subscriber.repository';
import { SubscribeNewsletterCommand } from './subscribe.command';
import { SubscribeNewsletterHandler } from './subscribe.handler';

describe('SubscribeNewsletterHandler', () => {
  function makeHandler(returnValue = true) {
    const repo: NewsletterSubscriberRepository = {
      subscribe: jest.fn().mockResolvedValue(returnValue),
    };
    return { handler: new SubscribeNewsletterHandler(repo), repo };
  }

  it('lowercases and trims the email before persisting', async () => {
    const { handler, repo } = makeHandler();
    await handler.execute(new SubscribeNewsletterCommand('  Hello@Example.COM  '));
    expect(repo.subscribe).toHaveBeenCalledWith('hello@example.com');
  });

  it('does not throw when the address is already subscribed', async () => {
    const { handler } = makeHandler(false);
    await expect(
      handler.execute(new SubscribeNewsletterCommand('dup@example.com')),
    ).resolves.toBeUndefined();
  });
});
