export type ModeKey = "light" | "dark";

export const MODE_COOKIE = "kroot-mode";
export const DEFAULT_MODE: ModeKey = "light";

// Dark mode (back on 2026-08-29) uses a real token-based palette defined
// under html[data-mode="dark"] in globals.css — the old approach was a
// `filter: invert(.94) hue-rotate(180deg)` over the whole document, which
// left brand colours wherever inversion happened to put them and made the
// primary button render pale grey, reading as disabled.
export const DARK_MODE_ENABLED = true;

// isModeKey/resolveMode used to run in the root layout, against the cookie
// read there. That read is gone — it made every route in the app dynamic — and
// the same logic now lives in the pre-paint inline script in the layout, which
// has to be plain inlined JS. Nothing else called them.

// Kept outside components so lint doesn't flag render-time DOM writes.
export function applyModeToDocument(mode: ModeKey) {
  document.documentElement.setAttribute("data-mode", mode);
  document.cookie = `${MODE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
}
