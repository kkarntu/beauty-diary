/**
 * Centralised route table. Use these helpers (not raw strings) so we can
 * refactor URLs in one place. Pair with `Link` from `@/i18n/navigation`
 * to keep the active locale.
 */
export const routes = {
  home: '/',
  landing: '/',
  feed: '/feed',
  search: '/search',
  notifications: '/notifications',

  // Posts
  postDetail: (slug: string) => `/posts/${slug}`,
  postEdit: (slug: string) => `/posts/${slug}/edit`,
  newPost: '/posts/new',

  // Categories & authors
  category: (slug: string) => `/category/${slug}`,
  author: (nickname: string) => `/users/${nickname}`,

  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Me
  me: '/me',
  meProfile: '/me/profile',
  meAccount: '/me/account',
  meNotifications: '/me/notifications',
  myPosts: '/me/posts',
  myFavorites: '/me/favorites',

  // Admin
  admin: '/admin',
  adminUsers: '/admin/users',
  adminAuditLog: '/admin/audit-log',
} as const;
