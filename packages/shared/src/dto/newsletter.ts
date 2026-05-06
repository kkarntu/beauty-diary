import { z } from 'zod';

export const SubscribeNewsletterDto = z.object({
  email: z.string().email().max(254),
});
export type SubscribeNewsletterDto = z.infer<typeof SubscribeNewsletterDto>;
