export type ModeKey = "light" | "dark";

export const MODE_COOKIE = "kroot-mode";
export const DEFAULT_MODE: ModeKey = "light";

// Dark mode (back on 2026-08-29) uses a real token-based palette defined
// under html[data-mode="dark"] in globals.css — the old approach was a
// `filter: invert(.94) hue-rotate(180deg)` over the whole document, which
// left brand colours wherever inversion happened to put them and made the
// primary button render pale grey, reading as disabled.
export const DARK_MODE_ENABLED = true;

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
