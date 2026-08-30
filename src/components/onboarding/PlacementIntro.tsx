"use client";

import { useTranslations } from "next-intl";
import { GOALS, type Goal } from "@/lib/level-test";
import { BTN_GHOST, BTN_GREEN, CARD, EYEBROW, FADE, H1, SUB, TILE, TILE_ICON, TILE_ON } from "./styles";

// Step 1 — can they read Hangul at all? A "not yet" skips the test entirely
// and routes the first lesson to /hangul; nothing else is readable before it.
export function GateCard({ onAnswer }: { onAnswer: (canRead: boolean) => void }) {
  const t = useTranslations("onboarding.gate");
  return (
    <section className={FADE}>
      <div className={CARD}>
        <span className={`${EYEBROW} block text-center mb-2.5`}>{t("eyebrow")}</span>
        <h1 className={H1}>{t("title")}</h1>
        <p className={SUB}>{t("sub")}</p>
        <p className="kr text-center font-bold text-[clamp(56px,12vw,84px)] leading-none tracking-[-0.02em] text-charcoal mt-2 mb-5">
          안녕
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <button type="button" className={TILE} onClick={() => onAnswer(true)}>
            <span className={TILE_ICON}>📖</span>
            <span>
              <b className="block text-[14.5px]">{t("yesTitle")}</b>
              <small className="block text-muted text-[12.5px] leading-[1.45]">{t("yesHint")}</small>
            </span>
          </button>
          <button type="button" className={TILE} onClick={() => onAnswer(false)}>
            <span className={TILE_ICON}>✨</span>
            <span>
              <b className="block text-[14.5px]">{t("noTitle")}</b>
              <small className="block text-muted text-[12.5px] leading-[1.45]">{t("noHint")}</small>
            </span>
          </button>
        </div>
        <p className="text-center text-[12px] text-faint mt-4">{t("foot")}</p>
      </div>
    </section>
  );
}

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
        <h1 className={H1}>{t("title")}</h1>
        <p className={SUB}>{t("sub")}</p>
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
