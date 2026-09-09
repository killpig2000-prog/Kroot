"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { playCorrect, setSfxEnabled, sfxEnabled, subscribeSfx } from "@/lib/sfx";

// One switch for the app's feedback chimes (right, wrong, water, coins,
// level up…). Stored per device — sound is a device preference, not an
// account one. Speech (the Korean voice) is never gated here; it's learning
// content, not feedback.
//
// Two exports: SfxRow is the switch on its own, for the Settings page's
// "Sound & display" card where it sits above the theme switches; the default
// export wraps it in a card of its own for anywhere that wants it standalone.
export function SfxRow() {
  const t = useTranslations("profile.sound");
  // Server snapshot says "on" so the first paint matches the default.
  const on = useSyncExternalStore(subscribeSfx, sfxEnabled, () => true);

  function toggle() {
    const next = !on;
    setSfxEnabled(next);
    // Turning it on plays the "right" chime so the switch answers itself.
    if (next) playCorrect();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="flex-1 min-w-0">
        <b className="block text-[14px] font-semibold">{t("sfxTitle")}</b>
        <span className="block text-[12.5px] text-muted leading-snug">{t("sfxDesc")}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={t("sfxTitle")}
        onClick={toggle}
        className={`relative flex-none w-11 h-6 rounded-full transition-colors ${on ? "bg-success" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SoundSettings() {
  const t = useTranslations("profile.sound");
  return (
    <div id="sound" className="border border-line rounded-[12px] px-[24px] py-5">
      <b className="font-semibold text-[15px] block mb-4">{t("title")}</b>
      <SfxRow />
    </div>
  );
}
