import { getTranslations } from "next-intl/server";

// "Words you know" — the Learn tab's headline (2026-09-09).
//
// Every number here is earned: a word counts once the learner has actually
// answered it. Nothing is predicted from words they never saw, and nothing
// is compared against other learners — this app is too small for a
// percentile to mean anything, and a made-up number would poison the rest
// of the page.
//
// The four bands are the SRS boxes (vocabulary_progress.box, 1..5), which
// are ordered, so they take one sequential ramp of the app's green rather
// than four separate hues.
export type WordBand = { label: string; count: number; fill: string };

const W = 300;
const H = 62;
const TOP = 8;
const BASE = 48;

export default async function KnownWords({
  total,
  delta,
  bands,
  series,
  startLabel,
  endLabel,
}: {
  total: number;
  delta: number;
  bands: WordBand[];
  /** Cumulative words known, oldest → newest. Fewer than 2 points: no curve. */
  series: number[];
  startLabel: string;
  endLabel: string;
}) {
  const t = await getTranslations("profile.learn");
  const sum = bands.reduce((a, b) => a + b.count, 0);

  // The curve starts at its own first value, not at zero: this is the
  // period's growth, and a zero baseline would draw a cliff that never
  // happened.
  const lo = series.length ? Math.min(...series) : 0;
  const hi = series.length ? Math.max(...series) : 0;
  const span = Math.max(1, hi - lo);
  const points = series.map((v, i) => {
    const x = series.length === 1 ? W : (W * i) / (series.length - 1);
    return [x, BASE - ((BASE - TOP) * (v - lo)) / span] as const;
  });
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = points.length > 1 ? `${line} L${W} ${BASE} L0 ${BASE} Z` : "";
  const last = points[points.length - 1];

  return (
    <div className="border border-line rounded-[14px] bg-cream px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <b className="font-semibold text-[14px]">{t("knownTitle")}</b>
        <span className="text-[12px] text-faint">{t("knownSource")}</span>
      </div>

      <div className="flex items-baseline gap-2.5 mt-1.5">
        <b className="font-extrabold text-[clamp(30px,8vw,38px)] leading-none tabular-nums text-success-deep">{total}</b>
        <span className="text-[13px] text-muted">{t("knownUnit")}</span>
        {delta > 0 && (
          <span className="ml-auto text-[12.5px] font-semibold tabular-nums text-success-deep bg-success-bg rounded-full px-2.5 py-0.5">
            {t("knownDelta", { n: delta })}
          </span>
        )}
      </div>

      {points.length > 1 && (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t("knownCurveAria", { from: lo, to: hi })}
          className="block w-full h-auto mt-2"
        >
          <defs>
            <linearGradient id="known-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-success)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--c-success)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={BASE} x2={W} y2={BASE} stroke="var(--c-line)" strokeWidth="1" />
          <path d={area} fill="url(#known-fill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--c-success-deep)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {last && <circle cx={last[0]} cy={last[1]} r="3" fill="var(--c-success-deep)" />}
          <text x="0" y={H - 2} fontSize="8" fill="var(--c-faint)">
            {startLabel}
          </text>
          <text x={W} y={H - 2} fontSize="8" fill="var(--c-faint)" textAnchor="end">
            {endLabel}
          </text>
        </svg>
      )}

      {sum > 0 && (
        <>
          <div className="flex h-[11px] rounded-full overflow-hidden mt-3">
            {bands.map((b) => (
              <span
                key={b.label}
                className="block"
                style={{ width: `${(b.count / sum) * 100}%`, background: b.fill }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2">
            {bands.map((b) => (
              <li key={b.label} className="flex items-center gap-1.5 text-[11.5px] text-muted">
                <span className="flex-none w-[9px] h-[9px] rounded-[3px]" style={{ background: b.fill }} aria-hidden="true" />
                <span className="min-w-0 truncate">{b.label}</span>
                <b className="ml-auto font-semibold tabular-nums text-charcoal">{b.count}</b>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
