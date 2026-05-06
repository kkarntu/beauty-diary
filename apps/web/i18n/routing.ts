import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uk', 'en'],
  defaultLocale: 'uk',
  // Default locale (`uk`) is served at `/`, `/feed`, `/posts/x`, …
  // English routes are prefixed: `/en`, `/en/feed`, `/en/posts/x`.
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
