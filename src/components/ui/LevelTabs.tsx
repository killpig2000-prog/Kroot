import { Link } from "@/i18n/navigation";
import type { CefrLevel } from "@/lib/tree";

/**
 * One-row CEFR level switcher shared by the skill index pages.
 *
 * Stays on a single line at every width (scrolls sideways on narrow phones)
 * so the six chips never stack into three rows and push content down. Locked
 * levels are compact — a lock and the level name — with the "how to unlock"
 * explanation collapsed into one caption under the row.
 */
export default function LevelTabs({
  levels,
  current,
  mine,
  unlocked,
  href,
  accent,
  className = "",
}: {
  levels: readonly CefrLevel[];
  /** Level whose content is shown right now. */
  current: CefrLevel;
  /** The user's own grade — gets a small "you" marker. */
  mine: CefrLevel;
  unlocked: (level: CefrLevel) => boolean;
  href: (level: CefrLevel) => string;
  /** Tailwind classes for the active chip, e.g. "bg-teal border-teal text-white". */
  accent: string;
  className?: string;
}) {
  const anyLocked = levels.some((lv) => !unlocked(lv));
  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Level"
        className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {levels.map((lv) => {
          const on = lv === current;
          const you = lv === mine;
          if (!unlocked(lv)) {
            return (
              <span
                key={lv}
                title="Pass the promotion test to unlock this level"
                aria-disabled="true"
                className="flex-none inline-flex items-center gap-1 rounded-[9px] px-3 py-1.5 text-[13px] font-semibold border bg-warm border-line text-faint opacity-70 select-none"
              >
                <span aria-hidden="true" className="text-[11px]">🔒</span>
                {lv}
              </span>
            );
          }
          return (
            <Link
              key={lv}
              href={href(lv)}
              role="tab"
              aria-selected={on}
              className={`flex-none inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold border transition-colors ${
                on ? accent : "bg-cream border-line text-muted hover:border-faint"
              }`}
            >
              {lv}
              {you && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-[.06em] ${on ? "opacity-80" : "text-faint"}`}
                >
                  you
                </span>
              )}
            </Link>
          );
        })}
      </div>
      {anyLocked && (
        <p className="text-[11.5px] text-faint mt-1">
          🔒 Locked levels open when you pass the promotion test.
        </p>
      )}
    </div>
  );
}
