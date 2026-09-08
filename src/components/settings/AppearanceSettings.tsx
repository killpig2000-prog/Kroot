"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SEASONS, applySeasonToDocument, seasonForDate } from "@/lib/seasons";
import { applyModeToDocument, type ModeKey } from "@/lib/mode";
import { SettingsRow, Switch } from "@/components/settings/SettingsCard";

// Dark mode and the seasonal theme. Both used to be squeezed into the sidebar
// account menu, where they sat next to Log out — a destructive action one row
// below two harmless switches. They live here now; the account menu keeps
// only the two things you go to it for.
//
// Initial values come off the <html> attributes the layout already rendered,
// so the first paint matches whatever the document is wearing.
export default function AppearanceSettings() {
  const t = useTranslations("settings");
  const [seasonOn, setSeasonOn] = useState<boolean>(
    () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-season"),
  );
  const [mode, setMode] = useState<ModeKey>(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-mode") === "dark"
      ? "dark"
      : "light",
  );

  const season = SEASONS[seasonForDate(new Date())];

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
      <SettingsRow
        icon={mode === "dark" ? "🌙" : "☀️"}
        title={t("darkMode")}
        desc={t("darkModeDesc")}
        trailing={<Switch on={mode === "dark"} onToggle={toggleMode} label={t("darkMode")} />}
      />
      <SettingsRow
        icon={season.emoji}
        title={t("seasonalTheme")}
        desc={t("seasonalThemeDesc", { season: season.label })}
        trailing={<Switch on={seasonOn} onToggle={toggleSeason} label={t("seasonalTheme")} />}
      />
    </>
  );
}
