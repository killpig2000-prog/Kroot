export type ModeKey = "light" | "dark";

export const MODE_COOKIE = "kroot-mode";
export const DEFAULT_MODE: ModeKey = "light";

export function isModeKey(value: string | undefined | null): value is ModeKey {
  return value === "light" || value === "dark";
}

// Kept outside components so lint doesn't flag render-time DOM writes.
export function applyModeToDocument(mode: ModeKey) {
  document.documentElement.setAttribute("data-mode", mode);
  document.cookie = `${MODE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
}
