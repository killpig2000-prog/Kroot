export type ThemeKey = "leaf" | "ocean" | "coral" | "lavender" | "sunshine" | "rose";

export const THEMES: { key: ThemeKey; label: string; kr: string; swatch: string }[] = [
  { key: "leaf", label: "Leaf", kr: "새싹그린", swatch: "#6BBF8A" },
  { key: "ocean", label: "Ocean", kr: "바다", swatch: "#4FA5C6" },
  { key: "coral", label: "Coral", kr: "코랄", swatch: "#F2825F" },
  { key: "lavender", label: "Lavender", kr: "라벤더", swatch: "#9B7FD4" },
  { key: "sunshine", label: "Sunshine", kr: "햇살", swatch: "#FFC94D" },
  { key: "rose", label: "Rose", kr: "로즈", swatch: "#F2789A" },
];

export const THEME_COOKIE = "kroot-theme";
export const DEFAULT_THEME: ThemeKey = "leaf";

export function isThemeKey(value: string | undefined | null): value is ThemeKey {
  return !!value && THEMES.some((t) => t.key === value);
}

// Kept outside any component/hook so lint doesn't treat the DOM writes as a render-time mutation.
export function applyThemeToDocument(key: ThemeKey) {
  document.documentElement.setAttribute("data-color-theme", key);
  document.cookie = `${THEME_COOKIE}=${key}; path=/; max-age=31536000; samesite=lax`;
}
