export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PostStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;
export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export const PostCategorySlug = {
  SKINCARE: 'skincare',
  MAKEUP: 'makeup',
  FASHION: 'fashion',
  WELLNESS: 'wellness',
  HAIR: 'hair',
  LIFESTYLE: 'lifestyle',
} as const;
export type PostCategorySlug = (typeof PostCategorySlug)[keyof typeof PostCategorySlug];
