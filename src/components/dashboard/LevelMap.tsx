import { Link } from "@/i18n/navigation";
import { LEVEL_ORDER, SPECIES, type CefrLevel } from "@/lib/tree";

// A1 → C2 stepper: where the learner is on the curriculum and how far the
// next level-up test is. Sits above the per-skill bars so "why am I doing
// these" has a visible answer.
export type LevelCheck = { label: string; ok: boolean; value: string };

export default function LevelMap({
  current,
  checks,
  eligible,
  overallPct,
}: {
  current: CefrLevel;
  checks: LevelCheck[];
  eligible: boolean;
  /** 0-100: average completion across skills at the current level. */
  overallPct: number;
}) {
  const idx = LEVEL_ORDER.indexOf(current);
  const next = LEVEL_ORDER[idx + 1] ?? null;
  const okCount = checks.filter((c) => c.ok).length;

  return (
    <div className="border border-line rounded-[14px] bg-white px-[22px] py-5 mb-[14px]">
      <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
        <b className="font-semibold text-[15px]">🗺️ Your path</b>
        <small className="text-[12.5px] text-faint font-medium">
          {next ? `${okCount}/${checks.length} checks toward ${next}` : "Top of the tree 🌟"}
        </small>
      </div>

      {/* stepper */}
      <ol className="flex items-center gap-0 mb-4" aria-label="CEFR levels">
        {LEVEL_ORDER.map((lv, i) => {
          const state = i < idx ? "done" : i === idx ? "now" : "todo";
          return (
            <li key={lv} className="flex items-center flex-1 min-w-0 last:flex-none">
              <span
                className={`flex-none flex flex-col items-center justify-center w-[42px] h-[42px] rounded-full border-[1.5px] text-[11.5px] font-extrabold transition-colors ${
                  state === "done"
                    ? "bg-success text-white border-success"
                    : state === "now"
                      ? "bg-success-bg text-success-deep border-success ring-4 ring-success-bg"
                      : "bg-white text-faint border-line"
                }`}
                title={`${lv} · ${SPECIES[lv].name}`}
              >
                <span className="text-[13px] leading-none">{state === "done" ? "✓" : SPECIES[lv].emoji}</span>
                <span className="leading-none mt-0.5">{lv}</span>
              </span>
              {i < LEVEL_ORDER.length - 1 && (
                <span className="flex-1 h-[3px] mx-1 rounded-full bg-line overflow-hidden">
                  <span
                    className="block h-full bg-success"
                    style={{ width: state === "done" ? "100%" : state === "now" ? `${overallPct}%` : "0%" }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {next ? (
        <Link
          href="/level-test"
          className={`flex items-center gap-3 rounded-[12px] px-4 py-3 border transition-colors ${
            eligible ? "border-success bg-success-bg hover:bg-[#DCFCE7]" : "border-line bg-warm hover:border-success"
          }`}
        >
          <span className="text-[20px] flex-none">🎯</span>
          <span className="flex-1 min-w-0">
            <b className="block text-[13.5px]">
              {eligible ? `Ready for the ${current} → ${next} test` : `Unlock ${next} · ${SPECIES[next].name}`}
            </b>
            <span className="flex gap-2.5 mt-0.5 flex-wrap">
              {checks.map((c) => (
                <small key={c.label} className={`text-[12px] font-semibold ${c.ok ? "text-success" : "text-faint"}`}>
                  {c.ok ? "✓" : "○"} {c.label} {c.value}
                </small>
              ))}
            </span>
          </span>
          <span className="flex-none text-[13px] font-bold text-success">{eligible ? "Start →" : "Details →"}</span>
        </Link>
      ) : (
        <p className="text-[13px] text-muted">You&apos;ve reached C2 — the whole garden is yours.</p>
      )}
    </div>
  );
}
