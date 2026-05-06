import { z } from 'zod';

export const CategoryDto = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  coverImageUrl: z.string().url().nullable(),
  sortOrder: z.number().int(),
});
export type CategoryDto = z.infer<typeof CategoryDto>;
