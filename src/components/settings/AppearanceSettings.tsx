"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SEASONS, applySeasonToDocument, seasonEndsOn, seasonForDate } from "@/lib/seasons";
import { applyModeToDocument, type ModeKey } from "@/lib/mode";
import { Row, Switch } from "@/components/settings/SettingsList";

// Dark mode and the seasonal theme. Both used to be squeezed into the sidebar
// account menu, where they sat next to Log out — a destructive action one row
// below two harmless switches. They live on the Sound & display screen now.
//
// Initial values come off the <html> attributes the layout already rendered,
// so the first paint matches whatever the document is wearing.
export default function AppearanceSettings() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [seasonOn, setSeasonOn] = useState<boolean>(
    () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-season"),
  );
  const [mode, setMode] = useState<ModeKey>(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-mode") === "dark"
      ? "dark"
      : "light",
  );

  const now = new Date();
  const season = SEASONS[seasonForDate(now)];
  // "Autumn Maple, until Nov 30" — when it changes is the useful fact; the
  // switch's name already says it's a theme.
  const until = seasonEndsOn(now).toLocaleDateString(locale, { month: "short", day: "numeric" });

  function toggleMode() {
    const next: ModeKey = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyModeToDocument(next);
  }

  function toggleSeason() {
    const next = !seasonOn;
    setSeasonOn(next);
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
