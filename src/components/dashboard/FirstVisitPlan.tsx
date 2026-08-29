import { Link } from "@/i18n/navigation";
import { showEverything } from "@/app/dashboard/actions";
import { buttonClassName } from "@/components/ui/Button";
import type { FirstVisitUnlocks } from "@/lib/first-visit";

// The one card a brand-new learner sees on Day 1: a five-minute plan with
// three tiny steps and a single button. Server component — the escape hatch
// is a plain form posting to a server action that sets a cookie.

export type FirstVisitStep = {
  /** "Hangul", "Vocab", "Water your seedling 💧" */
  label: string;
  /** "Consonants", "Unit 1 (10 words)" — omitted for the payoff step. */
  detail?: string;
  /** "2 min", "10 s" */
  time: string;
  /** Steps without a destination (the payoff) render as text. */
  href?: string;
};

export function FirstVisitPlan({ steps }: { steps: FirstVisitStep[] }) {
  const first = steps.find((s) => s.href);
  return (
    <div className="border-[1.5px] border-success rounded-[16px] bg-white px-[clamp(18px,3vw,26px)] py-5 mb-[30px] shadow-[0_14px_30px_-18px_rgba(60,50,30,.3)]">
      <div className="flex items-baseline justify-between gap-3 mb-3.5 flex-wrap">
        <b className="font-semibold text-[15.5px]">⏱️ Today · 5 minutes</b>
        <small className="text-[11.5px] font-bold tracking-[.06em] uppercase text-success-deep">Start here</small>
      </div>

      <ol className="mb-4 flex flex-col gap-2">
        {steps.map((s, i) => {
          const body = (
            <>
              <span className="flex-none w-6 h-6 rounded-full bg-success-bg border border-success-line text-success-deep text-[11.5px] font-bold flex items-center justify-center tabular-nums">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 text-[13.5px]">
                <b className="font-semibold text-charcoal">{s.label}</b>
                {s.detail && <span className="text-muted"> · {s.detail}</span>}
              </span>
              <small className="flex-none text-[12px] font-medium text-faint tabular-nums">{s.time}</small>
            </>
          );
          return (
            <li key={s.label}>
              {s.href ? (
                <Link
                  href={s.href}
                  className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 -mx-2 hover:bg-warm transition-colors"
                >
                  {body}
                </Link>
              ) : (
                <span className="flex items-center gap-3 px-2 py-1.5 -mx-2">{body}</span>
              )}
            </li>
          );
        })}
      </ol>

      {first && (
        <Link href={first.href!} className={buttonClassName("success", "inline-block w-full sm:w-auto text-center")}>
          Start step 1 →
        </Link>
      )}
    </div>
  );
}

// What's still locked, drawn as dimmed placeholder rows so the learner can
// see what the next sessions open up.
const LOCKED_ROWS: { key: keyof FirstVisitUnlocks; icon: string; title: string; note: string }[] = [
  { key: "quest", icon: "🎯", title: "Today's quest", note: "opens after session 1" },
  { key: "wotd", icon: "단", title: "Word of the day", note: "opens after session 2" },
  { key: "levelMap", icon: "🗺️", title: "Level map", note: "opens after session 3" },
  { key: "heatmap", icon: "🌿", title: "Study garden", note: "opens at a 3-day streak" },
];

export function LockedWidgets({ unlocked }: { unlocked: FirstVisitUnlocks }) {
  const rows = LOCKED_ROWS.filter((r) => !unlocked[r.key]);
  return (
    <div className="mb-[30px]">
      {rows.length > 0 && (
        <>
          <p className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2">Unlocks next</p>
          <ul className="flex flex-col gap-2 mb-4" aria-label="Locked dashboard sections">
            {rows.map((r) => (
              <li
                key={r.key}
                className="flex items-center gap-3.5 border border-dashed border-line rounded-[14px] bg-white/60 px-5 py-3.5 opacity-70"
              >
                <span
                  aria-hidden="true"
                  className={`flex-none w-9 h-9 rounded-[10px] bg-warm-2 border border-line flex items-center justify-center text-[15px] grayscale ${
                    r.icon.length === 1 ? "kr font-semibold" : ""
                  }`}
                >
                  {r.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <b className="block font-semibold text-[13.5px] text-muted">
                    🔒 {r.title} <span className="font-medium text-faint">— {r.note}</span>
                  </b>
                  {/* faux content, blurred: a hint of the card that's coming */}
                  <span aria-hidden="true" className="mt-1.5 flex gap-2 blur-[2px] opacity-50">
                    <span className="block h-2 w-2/5 rounded-full bg-warm-3" />
                    <span className="block h-2 w-1/5 rounded-full bg-warm-2" />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <form action={showEverything} className="text-right">
        <button type="submit" className="text-[12px] font-semibold text-faint hover:text-muted underline underline-offset-2 transition-colors">
          Show everything now
        </button>
      </form>
    </div>
  );
}
