import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match every path except API routes, static files, and Next internals.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
