import slugify from 'slugify';
import type { PostRepository } from '../domain/ports/post.repository';

const slugOptions: Parameters<typeof slugify>[1] = {
  lower: true,
  strict: true,
  trim: true,
  locale: 'uk',
};

export function slugifyTitle(title: string): string {
  const base = slugify(title, slugOptions);
  if (base.length === 0) {
    return 'post';
  }
  return base.length > 80 ? base.slice(0, 80) : base;
}

export function slugifyTag(name: string): string {
  return slugify(name, slugOptions);
}

/**
 * Returns a slug guaranteed unique within the posts table by appending
 * a numeric suffix on collision (`my-post`, `my-post-2`, `my-post-3`, …).
 */
export async function generateUniquePostSlug(
  title: string,
  repo: Pick<PostRepository, 'findBySlug'>,
): Promise<string> {
  const base = slugifyTitle(title);
  let candidate = base;
  let counter = 2;
  while (await repo.findBySlug(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
    if (counter > 1000) {
      throw new Error('Could not generate a unique slug after 1000 attempts');
    }
  }
  return candidate;
}
