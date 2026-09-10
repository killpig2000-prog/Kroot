"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SKILL_HREF } from "@/components/dashboard/QuestButton";
import { playTap } from "@/lib/sfx";

// Today's quest on the phone is the watering can. Until it's done the
// button is dry ground — the app's warm sand with a cracked-earth pattern
// over it, an empty drop, "목말라요" — and once it's done it is watered
// ground: the same green every other primary button in the app is, a
// filled drop, "물 줬어요", "Done ✓". So green stops being the button's
// colour and becomes the reward's, and Done is the end of a story rather
// than the button with the colour taken out (2026-09-10, user call; the
// green-then-pale version lasted a day).
//
// The two words are the tree's — Korean first, a small gloss after, the
// way its speech bubble talks. The cracks are solid line-coloured strokes,
// no alpha: a translucent texture has no fixed colour (see 8acea24).
export default function TodaysQuestButton({
  quest,
  href,
}: {
  quest?: { skill_key: string; description: string; completed_at: string | null } | null;
  /** The specific chapter picked for today; falls back to the skill's hub. */
  href?: string;
}) {
  const t = useTranslations("dashboard.quest");
  const patternId = useId();
  if (!quest) return null;
  const done = !!quest.completed_at;
  const target = href ?? SKILL_HREF[quest.skill_key] ?? "/dashboard";
  const known = ["writing", "vocabulary", "listening", "reading", "pronunciation"].includes(quest.skill_key);
  const detail = known ? t(`descriptions.${quest.skill_key}`) : quest.description;
  // One "skill · what · how long" string; a no-break space before each "·"
  // so a wrapped line never starts with a dangling separator at 360px.
  const title = detail
    .split("·")
    .map((x) => x.trim())
    .join(" · ");

  const body = (
    <>
      {/* dry ground: a cracked-earth pattern in the line colour, solid */}
      {!done && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <pattern id={patternId} width="46" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M2 6 L10 9 L14 17 M10 9 L19 4 M14 17 L9 26 M26 2 L30 12 L40 15 M30 12 L24 22 L28 33 M40 15 L45 24 M9 26 L2 31 M24 22 L15 24"
                fill="none"
                stroke="var(--c-line)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      )}
      {/* watered ground: a vine wraps the button (2026-09-10, user call) —
          one 1.5px stem along the bottom edge that climbs both corners,
          five leaves, and a fine dot grain over the green. All in the lid
          colour, solid: decoration, not state, so nothing here is alpha. */}
      {done && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <pattern id={`${patternId}d`} width="5" height="5" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r=".65" fill="#468660" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId}d)`} />
        </svg>
      )}
      {done && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 358 66"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g fill="none" stroke="#5D9174" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke">
            <path d="M0 62 C60 58 90 66 140 60 S230 54 300 60 S340 64 358 60" />
            <path d="M4 60 C-2 48 6 36 2 20" />
            <path d="M354 60 C362 46 350 34 356 14" />
          </g>
          <g fill="#5D9174">
            <ellipse cx="96" cy="58" rx="6" ry="3" transform="rotate(-30 96 58)" />
            <ellipse cx="212" cy="55" rx="6" ry="3" transform="rotate(25 212 55)" />
            <ellipse cx="318" cy="57" rx="6" ry="3" transform="rotate(-20 318 57)" />
            <ellipse cx="5" cy="34" rx="5" ry="2.6" transform="rotate(60 5 34)" />
            <ellipse cx="353" cy="30" rx="5" ry="2.6" transform="rotate(-60 353 30)" />
          </g>
        </svg>
      )}
      <span
        className={`relative flex-none grid place-items-center w-9 h-9 rounded-[8px] ${
          done ? "bg-[#5D9174] text-white" : "bg-cream border border-line text-[#7A5A12]"
        }`}
      >
        {/* the drop fills when the ground is watered */}
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="flex-none">
          <path
            d="M12 4.1c3.2 3.7 5 6.2 5 8.4a5 5 0 0 1-10 0c0-2.2 1.8-4.7 5-8.4z"
            fill={done ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="relative flex-1 min-w-0 leading-[1.15]">
        <span className="block text-[10.5px] font-extrabold uppercase tracking-[.08em] opacity-80">
          {t("title")} · <span className="kr normal-case tracking-normal">{done ? "물 줬어요" : "목말라요"}</span>{" "}
          <span className="normal-case tracking-normal font-bold opacity-80">{done ? t("watered") : t("thirsty")}</span>
        </span>
        {/* Two lines at most, and the type steps down with the viewport: the
            writing quest's string ran to three lines at 360px and the button
            stopped reading as one. */}
        <span
          className="block font-semibold line-clamp-2 [text-wrap:balance]"
          style={{ fontSize: "clamp(14.5px, 4.1vw, 17px)" }}
        >
          {title}
        </span>
      </span>
      <span className="relative flex-none font-semibold" style={{ fontSize: "clamp(15px, 4.3vw, 17px)" }}>
        {done ? t("done") : t("start")}
      </span>
    </>
  );

  const shell = "relative overflow-hidden flex items-center gap-3 pl-4 pr-[14px] py-3 rounded-[12px] mb-3";

  // watered: the app's success tone — the reward is the colour every
  // primary button has, and it is not a link any more
  if (done) {
    return (
      <div className={`${shell} bg-success text-white shadow-[0_2px_0_var(--c-success-deep)]`}>
        {body}
      </div>
    );
  }

  // dry: warm sand on the line edge, the storybook press
  return (
    <Link
      href={target}
      onClick={playTap}
      className={`${shell} bg-warm-3 text-[#7A5A12] border border-line shadow-[0_2px_0_var(--c-line)] transition-[transform,box-shadow] duration-100 ease-out active:translate-y-[2px] active:shadow-[0_0_0_var(--c-line)]`}
    >
      {body}
    </Link>
  );
}
