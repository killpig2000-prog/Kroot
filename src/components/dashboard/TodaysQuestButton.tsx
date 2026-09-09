"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SKILL_HREF } from "@/components/dashboard/QuestButton";
import ModuleIcon from "@/components/dashboard/ModuleIcon";
import { playTap } from "@/lib/sfx";

// Which door's icon stands for a quest skill.
const SKILL_ICON: Record<string, string> = {
  hangul: "/hangul",
  vocabulary: "/vocabulary",
  writing: "/writing",
  reading: "/reading",
  listening: "/listening",
  pronunciation: "/speaking",
};

// Today's quest on the phone: the app's own primary button, made wide. Same
// fill, corners and 3px press the session "Next" buttons use
// (WritingBoards / WritePhase / WritingSession), so the one big thing on the
// home page is the same thing you press everywhere else — one row with the
// skill's drawn icon, two lines, and "Start ▸".
//
// It was a yellow `.btn-sun` pill for one day (option 2a, 2026-09-09); the
// user asked for corners and the green already in use instead, so the page
// is one family — green, cream, sky — and the quest says "press me" by size
// rather than by being the only yellow thing on the screen.
export default function TodaysQuestButton({
  quest,
  href,
}: {
  quest?: { skill_key: string; description: string; completed_at: string | null } | null;
  /** The specific chapter picked for today; falls back to the skill's hub. */
  href?: string;
}) {
  const t = useTranslations("dashboard.quest");
  if (!quest) return null;
  const completed = !!quest.completed_at;
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
      {/* The icon's lid is a solid step between the fill and white — not a
          translucent white, which came out as a washed #FFECBC on the old
          yellow and would be a muddy mint here. */}
      <span
        className={`flex-none grid place-items-center w-9 h-9 rounded-[8px] ${
          completed ? "bg-success-line text-success-deep" : "bg-[#5D9174] text-white"
        }`}
      >
        <ModuleIcon href={SKILL_ICON[quest.skill_key] ?? "/vocabulary"} size={22} />
      </span>
      <span className="flex-1 min-w-0 leading-[1.15]">
        <span className="block text-[10.5px] font-extrabold uppercase tracking-[.08em] opacity-75">{t("title")}</span>
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
      <span className="flex-none font-semibold" style={{ fontSize: "clamp(15px, 4.3vw, 17px)" }}>
        {completed ? t("done") : t("start")}
      </span>
    </>
  );

  const shell = "flex items-center gap-3 pl-4 pr-[14px] py-3 rounded-[12px] mb-3";

  // Done keeps the shape and the headline and only inverts — pale green
  // with deep-green type — so it reads as the same button, finished.
  if (completed) {
    return (
      <div className={`${shell} bg-success-bg text-success-deep shadow-[0_3px_0_var(--c-success-line)]`}>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={target}
      onClick={playTap}
      className={`${shell} bg-success text-white shadow-[0_3px_0_var(--c-success-deep)] transition-all hover:bg-success-deep active:translate-y-px active:shadow-[0_1px_0_var(--c-success-deep)]`}
    >
      {body}
    </Link>
  );
}
