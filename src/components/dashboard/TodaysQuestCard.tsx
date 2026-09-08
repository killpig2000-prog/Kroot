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
  // A no-break space before each "·" so a wrapped meta line never starts
  // with a dangling separator (360px: "…questions ·" / "~8 min").
  const meta = restParts.join("\u00A0· ");

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
        // The whole card is the deep green now, not just the button inside it
        // (user call 2026-09-08): the fill runs success -> success-deep across
        // the box, a pine stands at the right edge, and the type is white.
        // The Start pill flips to cream-on-green so it still reads as the
        // thing to press.
        className="group relative flex flex-col gap-[8px] overflow-hidden rounded-[20px] xl:rounded-[23px] border-[1.5px] border-[var(--c-success-deep)] pl-[17px] pr-[128px] py-[17px] xl:pr-[196px] transition-all hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(105deg, var(--c-success) 0%, var(--c-success) 34%, var(--c-success-deep) 92%)",
        }}
      >
        {/* Paper grain + a light from the top edge, so the green reads as a
            printed card rather than a flat fill. Soft-light keeps the noise
            from muddying the gradient underneath. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[.19] mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>\")",
            backgroundSize: "140px 140px",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,.13), rgba(255,255,255,0) 46%)" }}
        />

        {/* The pine stands upright at the right edge, its trunk running off
            the bottom of the card so it reads as a tree standing behind the
            card rather than a sticker on it. Stage C1 (not C2) on purpose:
            the C2 stage wears the mastery crown + sparkles, which would claim
            something about the learner that this card isn't saying. Height is
            clamp()ed off the viewport — the min fits a 360px phone, the max
            is reached by 430 and tablets don't get a bigger one. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-[148px] [--quest-tree:clamp(146px,39vw,168px)] xl:w-[196px] xl:[--quest-tree:204px]"
        >
          <span
            className="absolute inset-0"
            style={{ background: "radial-gradient(66% 88% at 54% 58%, rgba(12,38,25,.62), rgba(12,38,25,0) 76%)" }}
          />
          <svg
            viewBox="0 0 220 230"
            className="absolute right-[1px] bottom-[-24px] w-auto origin-bottom transition-transform duration-300 group-hover:rotate-[-5deg]"
            style={{ height: "var(--quest-tree)" }}
          >
            <LevelCreature level="C1" species="C2" hideGround />
          </svg>
        </span>

        <span className="relative text-[11px] font-bold uppercase tracking-[.09em] text-white/70">{t("title")}</span>
        <span className="relative block font-extrabold text-[24px] leading-[1.2] text-white">{head}</span>
        {meta && <span className="relative block text-[15px] text-white/80 -mt-[3px] [text-wrap:balance]">{meta}</span>}
        <span className="relative mt-[6px] inline-flex w-fit min-w-[170px] xl:min-w-[196px] items-center justify-center rounded-[14px] bg-cream px-[26px] py-[11px] text-[17px] font-bold text-success-deep transition-transform group-hover:translate-y-[-1px]">
          {t("start")}
        </span>
      </Link>
    </div>
  );
}
