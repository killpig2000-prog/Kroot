"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SKILL_HREF } from "@/components/dashboard/QuestButton";
import { playTap } from "@/lib/sfx";

// The one "what to do today" card — the only big button on the phone
// dashboard since the one-screen trim (2026-09-07). Icon square, title with
// the localized skill line under it (what · how long), arrow pill on the
// right. The half-width "compact" pairing with the review card is gone: the
// review is a slim row under this card now, shown only when words are due.
export default function TodaysQuestCard({
  quest,
  href,
}: {
  quest?: { skill_key: string; description: string; completed_at: string | null } | null;
  /** The specific chapter picked for today, e.g. "/reading/session?level=A1&chapter=3" —
   * falls back to the skill's generic hub page when it isn't available (a
   * level with no chapter pool, or a skill outside the reading/writing
   * rotation that some earlier `quest` row still carries). */
  href?: string;
}) {
  const t = useTranslations("dashboard.quest");
  if (!quest) return null;
  const completed = !!quest.completed_at;
  const target = href ?? SKILL_HREF[quest.skill_key] ?? "/dashboard";
  // Localized "Reading · one short passage · ~4 min"; the row's stored
  // description is the locale-free fallback for skills outside the map.
  const known = ["writing", "vocabulary", "listening", "reading", "pronunciation"].includes(quest.skill_key);
  const detail = known ? t(`descriptions.${quest.skill_key}`) : quest.description;

  const inner = (
    <>
      <span className="flex-none w-12 h-12 rounded-[12px] bg-cream border border-success-line flex items-center justify-center text-[22px] transition-transform group-hover:scale-110">
        🎯
      </span>
      <span className="flex-1 min-w-0">
        <b className="block font-bold text-[17px] leading-tight text-charcoal">{t("title")}</b>
        <span className="block text-[12.5px] font-semibold text-success-deep truncate mt-0.5">{detail}</span>
      </span>
    </>
  );

  if (completed) {
    return (
      <div className="mb-3 flex items-center gap-4 rounded-[16px] border-[1.5px] border-success bg-success-bg px-4 py-3.5">
        {inner}
        <span className="flex-none rounded-full bg-cream text-success text-[13px] font-bold px-4 py-2 border border-success-line">
          {t("done")}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <Link
        href={target}
        onClick={playTap}
        className="group flex items-center gap-4 rounded-[16px] border-[1.5px] border-success bg-success-bg px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:bg-[var(--tint-green)]"
      >
        {inner}
        <span className="flex-none rounded-full bg-success text-white text-[13px] font-bold px-4 py-2 transition-transform group-hover:translate-x-0.5">
          {t("go")}
        </span>
      </Link>
    </div>
  );
}
