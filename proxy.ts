// Next.js 16 uses proxy.ts (not middleware.ts).
// See: node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md
//
// This is the first middleware in the app. It's responsible for locale detection
// and routing via next-intl's createMiddleware.

import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export function proxy(request: any) {
  return createMiddleware(routing)(request);
}

export const config = {
  // Matcher: intercept all routes except /api, _next, _vercel, and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
