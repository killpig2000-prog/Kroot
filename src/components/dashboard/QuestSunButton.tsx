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

// Today's quest as the storybook sun button, option 2a (2026-09-09). The
// deep-green gradient card with the pine behind it was the heaviest thing
// on a page that is otherwise cream and sky; a `.btn-sun` pill says "this
// is the button" with the app's own chunky 5px shadow instead of 160px of
// dark green. Same target, same copy, same two states.
//
// `.btn-sun` carries only the colours and the press feel (5px shadow →
// 7px on hover, 2px on press), so it drops straight onto this row; `.btn`
// is deliberately left off, since it would impose its own padding, radius
// and centred layout and this pill is a three-part row (icon, two lines,
// "Start ▸").

export default function QuestSunButton({
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
    .join(" · ");

  const body = (
    <>
      {/* Cream, solid. White at 55% over #FFD66B came out #FFECBC — a bare
          washed yellow sitting next to the doors' solid #FFFDF6, which read
          as colour missing rather than colour chosen. This app's white is
          cream. */}
      <span className="flex-none grid place-items-center w-9 h-9 rounded-full bg-cream">
        <ModuleIcon href={SKILL_ICON[quest.skill_key] ?? "/vocabulary"} size={22} />
      </span>
      <span className="flex-1 min-w-0 leading-[1.15]">
        <span className="block text-[10.5px] font-extrabold uppercase tracking-[.08em] opacity-75">{t("title")}</span>
        {/* Two lines at most: the pill keeps its shape. The writing quest's
            string ("Writing · one chapter, a few questions · ~8 min") ran to
            three lines at 360px and the rounded-full ends stopped reading as
            a button, so the type steps down with the viewport. */}
        <span
          className="hand block font-semibold line-clamp-2 [text-wrap:balance]"
          style={{ fontSize: "clamp(14.5px, 4.1vw, 17px)" }}
        >
          {title}
        </span>
      </span>
      <span className="hand flex-none font-semibold" style={{ fontSize: "clamp(15px, 4.3vw, 17px)" }}>
        {completed ? t("done") : t("start")}
      </span>
    </>
  );

  const shell = "flex items-center gap-3 pl-4 pr-[14px] py-3 rounded-full mb-3";

  // Done keeps the shape and the headline and only changes colour — the
  // day's one big thing reads as finished, not as something that vanished.
  if (completed) {
    return (
      <div
        className={`${shell} bg-success-bg text-success-deep`}
        style={{ boxShadow: "0 5px 0 var(--c-success-line)" }}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={target}
      onClick={playTap}
      className={`${shell} btn-sun transition-[transform,box-shadow] duration-150`}
    >
      {body}
    </Link>
  );
}
