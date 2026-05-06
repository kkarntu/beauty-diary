import { z } from 'zod';

export const TrendingTagDto = z.object({
  slug: z.string(),
  name: z.string(),
  postCount: z.number().int().nonnegative(),
});
export type TrendingTagDto = z.infer<typeof TrendingTagDto>;
