"use client";

import { useTranslations } from "next-intl";
import { GOALS, type Goal } from "@/lib/level-test";
import { BTN_GHOST, BTN_GREEN, CARD, FADE, H1, TILE, TILE_ICON, TILE_ON } from "./styles";

// Step 1 (can they read Hangul?) is SeedIntro now — the seed asks it at the
// end of the first-open scene; the answer still arrives as `canRead` here.

// Step 2 — why they're here. Only reorders the first lessons; skippable.
export function GoalCard({
  canRead,
  goal,
  onPick,
  onContinue,
}: {
  canRead: boolean;
  goal: Goal | null;
  onPick: (goal: Goal) => void;
  onContinue: () => void;
}) {
  const t = useTranslations("onboarding.goal");
  const tg = useTranslations("onboarding.goals");
  return (
    <section className={FADE}>
      <div className={CARD}>
        <h1 className={`${H1} mb-5`}>{t("title")}</h1>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {GOALS.map((g) => (
            <button
              key={g.key}
              type="button"
              className={`${TILE} ${goal === g.key ? TILE_ON : ""}`}
              onClick={() => onPick(g.key)}
              aria-pressed={goal === g.key}
            >
              <span className={TILE_ICON}>{g.icon}</span>
              <span>
                <b className="block text-[14.5px]">{tg(`${g.key}.label`)}</b>
                <small className="block text-muted text-[12.5px] leading-[1.45]">{tg(`${g.key}.hint`)}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-[18px] flex items-center justify-between gap-3">
          <button type="button" className={BTN_GHOST} onClick={onContinue}>
            {t("skip")}
          </button>
          <button type="button" className={BTN_GREEN} onClick={onContinue} disabled={goal === null}>
            {canRead ? t("startTest") : t("seePlan")}
          </button>
        </div>
      </div>
    </section>
  );
}
