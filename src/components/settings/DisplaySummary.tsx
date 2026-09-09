"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { sfxEnabled, subscribeSfx } from "@/lib/sfx";
import { SEASONS, seasonForDate } from "@/lib/seasons";

// The one-line summary under "Sound & display" on the first Settings screen:
// "Sound on · Light · Autumn Maple off". All three are device settings that
// live in the browser (a localStorage flag and two <html> attributes), so
// only the client knows them. The server snapshot is blank rather than a
// guess — a wrong summary that flips after hydration is worse than a line
// that fills in.
const never = () => () => {};
const readMode = () =>
  typeof document !== "undefined" && document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light";
const readSeason = () => typeof document !== "undefined" && document.documentElement.hasAttribute("data-season");

export default function DisplaySummary() {
  const t = useTranslations("settings");
  const sfx = useSyncExternalStore(subscribeSfx, sfxEnabled, () => null as boolean | null);
  const mode = useSyncExternalStore(never, readMode, () => null as "light" | "dark" | null);
  const seasonOn = useSyncExternalStore(never, readSeason, () => null as boolean | null);

  if (sfx === null || mode === null || seasonOn === null) return <>&nbsp;</>;

  const season = SEASONS[seasonForDate(new Date())].label;
  return (
    <>
      {sfx ? t("soundOn") : t("soundOff")} · {mode === "dark" ? t("modeDark") : t("modeLight")} ·{" "}
      {seasonOn ? t("seasonOn", { season }) : t("seasonOff", { season })}
    </>
  );
}
