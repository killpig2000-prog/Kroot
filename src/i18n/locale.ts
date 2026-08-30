import { routing } from "./routing";

// The cookie next-intl writes; the proxy also reads it to send a returning
// visitor to the language they last chose when a URL carries no prefix
// (server redirect("/x"), a typed URL, a bookmark from before the switch).
export const LOCALE_COOKIE = "NEXT_LOCALE";

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return !!value && (routing.locales as readonly string[]).includes(value);
}

const PREFIX = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

// "/ja/vocabulary?x=1" → "/vocabulary?x=1". next-intl's Link/router add the
// active locale themselves, so a path that already carries one would end
// up as /ja/ja/vocabulary (a 404).
export function stripLocale(href: string): string {
  const stripped = href.replace(PREFIX, "");
  return stripped === "" || stripped.startsWith("?") ? `/${stripped}` : stripped;
}

// Set the cookie before navigating to the default locale: the proxy would
// otherwise read the old value and bounce the bare URL straight back.
export function rememberLocale(locale: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
