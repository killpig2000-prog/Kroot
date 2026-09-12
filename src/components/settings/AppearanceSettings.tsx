"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SEASONS, applySeasonToDocument, seasonEndsOn, seasonForDate } from "@/lib/seasons";
import { applyModeToDocument, type ModeKey } from "@/lib/mode";
import { Row, Switch } from "@/components/settings/SettingsList";

// The switches read the <html> attributes directly. A lazy useState read them
// during hydration, which disagreed with the server's "off" and left both
// switches showing OFF while the theme was on.
function subscribeHtml(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season", "data-mode"] });
  return () => observer.disconnect();
}
const readSeason = () => document.documentElement.hasAttribute("data-season");
const readMode = (): ModeKey => (document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light");

// Dark mode and the seasonal theme. Both used to be squeezed into the sidebar
// account menu, where they sat next to Log out — a destructive action one row
// below two harmless switches. They live on the Sound & display screen now.
export default function AppearanceSettings() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const seasonOn = useSyncExternalStore(subscribeHtml, readSeason, () => false);
  const mode = useSyncExternalStore(subscribeHtml, readMode, (): ModeKey => "light");

  const now = new Date();
  const season = SEASONS[seasonForDate(now)];
  // "Autumn Maple, until Nov 30" — when it changes is the useful fact; the
  // switch's name already says it's a theme.
  const until = seasonEndsOn(now).toLocaleDateString(locale, { month: "short", day: "numeric" });

  function toggleMode() {
    applyModeToDocument(mode === "dark" ? "light" : "dark");
  }

  function toggleSeason() {
    const next = !seasonOn;
    applySeasonToDocument(next);
    // The always-mounted SeasonalEffects layer fades in/out on this event.
    window.dispatchEvent(new CustomEvent("kroot-season", { detail: { enabled: next } }));
  }

  return (
    <>
      <Row
        title={t("darkMode")}
        trailing={<Switch on={mode === "dark"} onToggle={toggleMode} label={t("darkMode")} />}
      />
      <Row
        title={t("seasonalTheme")}
        desc={t("seasonalThemeUntil", { season: season.label, date: until })}
        trailing={<Switch on={seasonOn} onToggle={toggleSeason} label={t("seasonalTheme")} />}
      />
    </>
  );
}
