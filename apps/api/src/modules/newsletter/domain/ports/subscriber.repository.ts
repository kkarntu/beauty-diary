export interface NewsletterSubscriberRepository {
  /**
   * Idempotent: returns true if a new row was inserted, false if the
   * email was already subscribed. Either way the caller treats the
   * outcome as success — we don't leak whether the address was new.
   */
  subscribe(email: string): Promise<boolean>;
}

export const NEWSLETTER_SUBSCRIBER_REPOSITORY = Symbol(
  'NEWSLETTER_SUBSCRIBER_REPOSITORY',
);
