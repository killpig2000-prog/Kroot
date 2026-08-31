import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/locale";
import { SITE_URL } from "@/lib/site";

// Absolute URLs and hreflang sets for the public, crawlable pages.
//
// Every one of these pages lives under [locale], and next-intl runs with
// localePrefix "as-needed": English is the bare path (/words/mul-water) and
// the other four locales carry their prefix (/ja/words/mul-water). Before
// this file existed the public pages hardcoded the bare English URL as their
// canonical, so /ja/words/mul-water told Google "the real page is the English
// one" — every localized URL was asking to be dropped from the index.

export type SeoAlternates = {
  canonical: string;
  languages: Record<AppLocale | "x-default", string>;
};

// `path` is always locale-less and root-relative ("/", "/words/mul-water").
export function localeUrl(locale: string, path: string): string {
  const suffix = path === "/" ? "" : path;
  return locale === routing.defaultLocale
    ? `${SITE_URL}${suffix}`
    : `${SITE_URL}/${locale}${suffix}`;
}

// The hreflang cluster for one page: every locale it is reachable in, plus
// x-default on English, which is what a crawler falls back to for a language
// we don't ship.
export function languageAlternates(path: string): Record<AppLocale | "x-default", string> {
  const languages = { "x-default": localeUrl(routing.defaultLocale, path) } as Record<
    AppLocale | "x-default",
    string
  >;
  for (const locale of routing.locales) languages[locale] = localeUrl(locale, path);
  return languages;
}

// What a page's `alternates` should be: a canonical pointing at *itself* in
// the locale being rendered, and the full hreflang set so the five URLs are
// declared as translations of each other rather than as five rival pages.
export function seoAlternates(locale: string, path: string): SeoAlternates {
  return { canonical: localeUrl(locale, path), languages: languageAlternates(path) };
}

// Everything that only ever renders for a signed-in visitor. A crawler that
// follows one of these gets a redirect to /auth/login, so it burns crawl
// budget to reach nothing indexable — hence the robots.txt block.
//
// This mirrors PROTECTED_PREFIXES in src/proxy.ts; the two lists have to stay
// in step, and the proxy should eventually import this one rather than keep
// its own copy.
export const LOGGED_IN_PREFIXES = [
  "/admin",
  "/community",
  "/dashboard",
  "/grammar",
  "/guide",
  "/hangul",
  "/level-test",
  "/listening",
  "/pronunciation",
  "/profile",
  "/reading",
  "/review",
  "/shop",
  "/speaking",
  "/vocabulary",
  "/writing",
];

// Routes that exist only to redirect or to serve the installed PWA offline;
// nothing here is a search result.
export const NON_INDEXABLE_PREFIXES = ["/league", "/offline", "/stats"];

// robots.txt matches from the start of the path, so "/dashboard" says nothing
// about "/ja/dashboard". Each blocked prefix is emitted once bare (English)
// and once per prefixed locale.
export function withLocalePrefixes(paths: string[]): string[] {
  return paths.flatMap((path) => [
    path,
    ...routing.locales
      .filter((locale) => locale !== routing.defaultLocale)
      .map((locale) => `/${locale}${path}`),
  ]);
}
