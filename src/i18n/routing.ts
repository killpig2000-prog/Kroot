import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'es', 'ja', 'zh-Hans', 'vi'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Locale prefix strategy: "as-needed" means English (default) has no prefix,
  // other locales are prefixed (e.g., /es/vocabulary). Zero risk to existing
  // bookmarked/indexed URLs (/vocabulary, /words/mul-water stay unchanged).
  localePrefix: 'as-needed',

  // Auto-redirect based on browser Accept-Language now that es content
  // (vocab/reading/writing/listening) is fully translated, not a partial
  // pilot — see es-translation-done-2026-09-04 memory.
  localeDetection: true,
});
