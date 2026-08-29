import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Locale prefix strategy: "as-needed" means English (default) has no prefix,
  // other locales are prefixed (e.g., /es/vocabulary). Zero risk to existing
  // bookmarked/indexed URLs (/vocabulary, /words/mul-water stay unchanged).
  localePrefix: 'as-needed',

  // Disable automatic redirect based on browser Accept-Language to protect
  // the English-speaking user base while the Spanish pilot is new.
  // Spanish is reachable only via explicit /es/... URLs.
  localeDetection: false,
});
