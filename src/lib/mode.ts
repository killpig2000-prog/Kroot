export type ModeKey = "light" | "dark";

export const MODE_COOKIE = "kroot-mode";
export const DEFAULT_MODE: ModeKey = "light";

// Dark mode is switched off (2026-08-28). It was never a real palette — just
// `filter: invert(.94) hue-rotate(180deg)` over the whole document, so brand
// colours landed wherever inversion put them and the primary button rendered
// pale grey, reading as disabled. The toggle sat in the mobile menu sheet
// where it was easy to hit by accident, and once hit there was no way back
// without finding it again.
//
// The cookie is deliberately ignored rather than merely un-toggleable, so a
// device already stuck in dark returns to light on its next page load. Turn
// this back on together with a real token-based dark palette; the CSS in
// globals.css (html[data-mode="dark"]) is still there.
export const DARK_MODE_ENABLED = false;

export function isModeKey(value: string | undefined | null): value is ModeKey {
  return value === "light" || value === "dark";
}

/** The mode actually applied, honouring the kill switch above. */
export function resolveMode(cookieValue: string | undefined | null): ModeKey {
  if (!DARK_MODE_ENABLED) return "light";
  return isModeKey(cookieValue) ? cookieValue : DEFAULT_MODE;
}

// Kept outside components so lint doesn't flag render-time DOM writes.
export function applyModeToDocument(mode: ModeKey) {
  document.documentElement.setAttribute("data-mode", mode);
  document.cookie = `${MODE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
}
