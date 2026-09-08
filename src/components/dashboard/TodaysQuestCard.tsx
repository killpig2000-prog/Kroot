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

  // One card, two states. Done doesn't swap in a different, smaller card
  // (user call 2026-09-08): the day's one big thing keeps its shape, its
  // headline and its pine, and the colour inverts — deep green with cream
  // type becomes pale green with deep-green type, and the Start pill becomes
  // a filled "Done ✓". So it reads as the same card, finished, rather than
  // as something that vanished.
  const body = (
    <>
      {/* Paper grain + a light from the top edge, so the fill reads as a
          printed card rather than flat colour. Soft-light keeps the noise
          from muddying the gradient underneath. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 mix-blend-soft-light ${completed ? "opacity-[.10]" : "opacity-[.19]"}`}
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
          style={{
            // The pool behind the pine darkens the green card and lightens
            // the pale one — either way it lifts the tree off the fill.
            background: completed
              ? "radial-gradient(66% 88% at 54% 58%, rgba(255,255,255,.52), rgba(255,255,255,0) 74%)"
              : "radial-gradient(66% 88% at 54% 58%, rgba(12,38,25,.62), rgba(12,38,25,0) 76%)",
          }}
        />
        <svg
          viewBox="0 0 220 230"
          className="absolute right-[7px] xl:right-[2px] bottom-[-24px] w-auto origin-bottom transition-transform duration-300 group-hover:rotate-[-5deg]"
          style={{ height: "var(--quest-tree)" }}
        >
          <LevelCreature level="C1" species="C2" hideGround />
        </svg>
      </span>

      <span
        className={`relative text-[11px] font-bold uppercase tracking-[.09em] ${
          completed ? "text-success-deep/70" : "text-white/70"
        }`}
      >
        {t("title")}
      </span>
      <span
        className={`relative block font-extrabold text-[24px] leading-[1.2] ${
          completed ? "text-success-deep" : "text-white"
        }`}
      >
        {head}
      </span>
      {meta && (
        <span
          className={`relative block text-[15px] -mt-[3px] [text-wrap:balance] ${
            completed ? "text-success-deep/75" : "text-white/80"
          }`}
        >
          {meta}
        </span>
      )}
      <span
        className={`relative mt-[6px] inline-flex w-fit min-w-[clamp(144px,40vw,178px)] xl:min-w-[196px] items-center justify-center rounded-[14px] px-[26px] py-[11px] text-[17px] font-bold ${
          completed
            ? "bg-success-deep text-cream"
            : "bg-cream text-success-deep transition-transform group-hover:translate-y-[-1px]"
        }`}
      >
        {completed ? t("done") : t("start")}
      </span>
    </>
  );

  // No border on either state: on the deep green the outline only added a
  // hairline a shade off the fill, and the pale card holds its own shape
  // against the cream page.
  const shell =
    "group relative flex flex-col gap-[8px] overflow-hidden rounded-[20px] xl:rounded-[23px] pl-[17px] pr-[128px] py-[17px] xl:pr-[196px]";

  if (completed) {
    return (
      <div className="mb-3">
        <div
          className={shell}
          style={{
            background:
              "linear-gradient(105deg, var(--c-success-bg) 0%, var(--c-success-bg) 38%, var(--c-success-line) 96%)",
          }}
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <Link
        href={target}
        onClick={playTap}
        className={`${shell} transition-all hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99]`}
        style={{
          background: "linear-gradient(105deg, var(--c-success) 0%, var(--c-success) 34%, var(--c-success-deep) 92%)",
        }}
      >
        {body}
      </Link>
    </div>
  );
}
