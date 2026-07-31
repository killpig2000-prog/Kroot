export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

export const SEASON_COOKIE = "kroot-season"; // "on" | "off" — default on

export const SEASONS: Record<
  SeasonKey,
  { label: string; emoji: string; particles: string[]; direction: "fall" | "rise" }
> = {
  spring: { label: "Cherry Blossom", emoji: "🌸", particles: ["🌸"], direction: "fall" },
  summer: { label: "Summer Splash", emoji: "🫧", particles: ["🫧"], direction: "rise" },
  autumn: { label: "Autumn Maple", emoji: "🍁", particles: ["🍁", "🍂"], direction: "fall" },
  winter: { label: "First Snow", emoji: "❄️", particles: ["❄️"], direction: "fall" },
};

/** Season for a given date: 3-5 spring, 6-8 summer, 9-11 autumn, 12-2 winter. */
export function seasonForDate(date: Date): SeasonKey {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

export function applySeasonToDocument(enabled: boolean) {
  if (enabled) {
    document.documentElement.setAttribute("data-season", seasonForDate(new Date()));
  } else {
    document.documentElement.removeAttribute("data-season");
  }
  document.cookie = `${SEASON_COOKIE}=${enabled ? "on" : "off"}; path=/; max-age=31536000; samesite=lax`;
}
