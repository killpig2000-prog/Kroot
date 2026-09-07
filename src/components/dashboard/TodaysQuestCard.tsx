"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SKILL_HREF } from "@/components/dashboard/QuestButton";
import LevelCreature from "@/components/dashboard/LevelCreature";
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

  // The mockup's card: eyebrow, the task as the headline, the details under
  // it, then a full-width button — its px scaled 1.45× from the 268px frame.
  // The stored description is one "skill · what · how long" string; its first
  // segment is the headline and the rest is the meta line.
  const [head, ...restParts] = detail.split("·").map((x) => x.trim());
  const meta = restParts.join(" · ");

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
        className="group flex flex-col gap-[8px] rounded-[23px] border-[1.5px] border-success bg-success-bg px-[17px] py-[17px] transition-all hover:-translate-y-0.5 hover:bg-[var(--tint-green)]"
      >
        <span className="text-[11px] font-bold uppercase tracking-[.09em] text-success-deep/70">{t("title")}</span>
        <span className="block font-extrabold text-[24px] leading-[1.2] text-charcoal">{head}</span>
        {meta && <span className="block text-[15px] text-success-deep -mt-[3px]">{meta}</span>}
        {/* The button carries a tree on its right, the deep green closing
            around it so the illustration reads as part of the button rather
            than a sticker on top of it: the fill runs from success to
            success-deep left→right, and a soft darker pool sits right under
            the tree. */}
        <span
          className="relative mt-[2px] flex items-center overflow-hidden rounded-[16px] pl-[18px] pr-[104px] py-[15px] transition-transform group-hover:translate-y-[-1px]"
          style={{
            background: "linear-gradient(90deg, var(--c-success) 0%, var(--c-success) 38%, var(--c-success-deep) 88%)",
          }}
        >
          <span className="text-[18px] font-bold text-white">{t("start")}</span>
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[112px]">
            <span
              className="absolute inset-0"
              style={{ background: "radial-gradient(64% 92% at 56% 56%, rgba(14,42,28,.72), rgba(14,42,28,0) 74%)" }}
            />
            <svg
              viewBox="0 0 220 230"
              className="absolute right-[10px] top-1/2 -translate-y-1/2 w-auto"
              style={{ height: "clamp(54px, 15vw, 68px)" }}
            >
              <LevelCreature level="B1" hideGround />
            </svg>
          </span>
        </span>
      </Link>
    </div>
  );
}
