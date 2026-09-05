// Presentational pieces for /admin — pure functions over already-aggregated
// data, no client JS needed (SVG <title> gives a native hover tooltip).

const TILE = "rounded-[14px] border border-line bg-cream p-[15px] shadow-[0_1px_2px_rgba(74,66,55,.05),0_8px_24px_rgba(74,66,55,.06)]";
const PANEL = "rounded-2xl border border-line bg-cream p-5 shadow-[0_1px_2px_rgba(74,66,55,.05),0_8px_24px_rgba(74,66,55,.06)]";

export function Panel({ title, sub, children, right }: { title?: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className={PANEL}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2.5">
          <div>
            {title && <h3 className="text-[12.5px] font-extrabold">{title}</h3>}
            {sub && <p className="text-[11px] text-faint mt-0.5">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatTile({ label, value, sub, trend }: { label: string; value: string | number; sub?: string; trend?: "up" | "flat" }) {
  return (
    <div className={TILE}>
      <p className="text-[10.5px] font-black uppercase tracking-[.06em] text-faint">{label}</p>
      <p className="text-[25px] font-extrabold tracking-[-0.02em] mt-0.5 tabular-nums">{value}</p>
      {sub && (
        <p className={`text-[11px] font-bold mt-1 ${trend === "up" ? "text-success-deep" : "text-faint"}`}>
          {trend === "up" && "▲ "}
          {sub}
        </p>
      )}
    </div>
  );
}

/** Vertical bars over N days, e.g. signups/day. */
export function DayBarChart({ data, color = "var(--c-teal)" }: { data: { day: string; value: number }[]; color?: string }) {
  const W = 900,
    H = 130,
    pad = 4;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[130px]" role="img" aria-label="일별 추이">
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1={pad} x2={W - pad} y1={H - 22 - f * (H - 34)} y2={H - 22 - f * (H - 34)} stroke="var(--c-line)" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 34);
        const x = pad + i * bw;
        return (
          <rect key={d.day} x={x + 1} y={H - 22 - h} width={Math.max(1, bw - 2)} height={h} rx={2.5} fill={color}>
            <title>
              {d.day} · {d.value}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}

/** Two overlaid trend lines (e.g. DAU / WAU) with area fill under each. */
export function TrendLines({
  series,
}: {
  series: { label: string; color: string; values: number[] }[];
}) {
  const W = 620,
    H = 130,
    pad = 6;
  const max = Math.max(1, ...series.flatMap((s) => s.values)) * 1.05;
  const n = Math.max(...series.map((s) => s.values.length));
  const step = (W - pad * 2) / Math.max(1, n - 1);
  const path = (vals: number[], area: boolean) => {
    let d = vals.map((v, i) => `${i === 0 ? "M" : "L"} ${(pad + i * step).toFixed(1)} ${(H - 18 - (v / max) * (H - 28)).toFixed(1)}`).join(" ");
    if (area) d += ` L ${W - pad} ${H - 18} L ${pad} ${H - 18} Z`;
    return d;
  };
  return (
    <div>
      <div className="flex gap-3.5 flex-wrap mb-2.5 text-[11.5px] font-bold text-muted">
        {series.map((s) => (
          <span key={s.label}>
            <span className="inline-block w-[9px] h-[9px] rounded-[3px] mr-1 align-[-1px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[130px]" role="img" aria-label="추이 그래프">
        {[0, 0.5, 1].map((f) => (
          <line key={f} x1={pad} x2={W - pad} y1={18 + f * (H - 28)} y2={18 + f * (H - 28)} stroke="var(--c-line)" strokeWidth={1} />
        ))}
        {series.map((s) => (
          <g key={s.label}>
            <path d={path(s.values, true)} fill={s.color} opacity={0.12} stroke="none" />
            <path d={path(s.values, false)} fill="none" stroke={s.color} strokeWidth={2} />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Horizontal ranked bars — feature usage, streak buckets, goals, locales. */
export function BarList({
  rows,
  color = "var(--c-teal)",
  colors,
  labelWidth = 130,
}: {
  rows: { label: string; value: number; hint?: string }[];
  color?: string;
  /** Per-row colors, overrides `color` when present (index-aligned). */
  colors?: string[];
  labelWidth?: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r, i) => (
        <div key={r.label} className="grid items-center gap-2.5 text-[12px]" style={{ gridTemplateColumns: `${labelWidth}px 1fr 56px` }}>
          <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{r.label}</span>
          <span className="h-[15px] rounded-[5px] bg-warm overflow-hidden block">
            <span className="block h-full rounded-[5px]" style={{ width: `${(r.value / max) * 100}%`, background: colors?.[i] ?? color }} />
          </span>
          <span className="text-right font-bold text-muted tabular-nums">{r.hint ?? r.value.toLocaleString()}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-faint text-center py-3">데이터 없음</p>}
    </div>
  );
}

/** Declining-count funnel with per-step conversion. */
export function Funnel({ steps }: { steps: { label: string; hint: string; count: number }[] }) {
  const max = Math.max(1, steps[0]?.count ?? 1);
  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((s, i) => {
        const pct = Math.round((s.count / max) * 100);
        const prev = i > 0 ? steps[i - 1].count : s.count;
        const conv = prev ? Math.round((s.count / prev) * 100) : 100;
        return (
          <div key={s.label} className="grid grid-cols-[92px_1fr_52px_40px] sm:grid-cols-[118px_1fr_64px_44px] items-center gap-2 sm:gap-2.5 text-[12px]">
            <span>
              <b>{s.label}</b>
              <small className="block text-[10.5px] text-faint">{s.hint}</small>
            </span>
            <span className="h-[22px] rounded-[6px] bg-warm overflow-hidden block relative">
              <span
                className="h-full rounded-[6px] block"
                style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--c-sky-deep), var(--c-teal))" }}
              />
            </span>
            <span className="text-right font-extrabold tabular-nums">{s.count.toLocaleString()}</span>
            <span className="text-right text-faint text-[11px] tabular-nums">{i === 0 ? "100%" : `${conv}%`}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Per-level stacked mode-adoption bars (Writing tiles/slots/chunks/typed). */
export function StackedBars({
  rows,
  keys,
  colors,
}: {
  rows: { label: string; values: number[] }[];
  keys: string[];
  colors: string[];
}) {
  return (
    <div>
      <div className="flex gap-3.5 flex-wrap mb-3 text-[11.5px] font-bold text-muted">
        {keys.map((k, i) => (
          <span key={k}>
            <span className="inline-block w-[9px] h-[9px] rounded-[3px] mr-1 align-[-1px]" style={{ background: colors[i] }} />
            {k}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const total = Math.max(1, r.values.reduce((s, v) => s + v, 0));
          return (
            <div key={r.label} className="grid grid-cols-[64px_1fr] gap-2.5 items-center text-[12px]">
              <span className="font-mono font-extrabold">{r.label}</span>
              <div className="flex h-4 rounded-[5px] overflow-hidden gap-[2px]">
                {r.values.map(
                  (v, i) =>
                    v > 0 && (
                      <span key={i} style={{ width: `${(v / total) * 100}%`, background: colors[i] }} title={`${keys[i]} ${v}%`} />
                    )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  good: "bg-success-bg text-success-deep",
  warning: "bg-[var(--tint-amber)] text-amber",
  critical: "bg-danger-bg text-danger",
};

export function Pill({ status, children }: { status: "good" | "warning" | "critical"; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLE[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {children}
    </span>
  );
}

export function Gauge({ pct, color = "var(--c-success)", label }: { pct: number; color?: string; label: string }) {
  return (
    <div>
      <div className="h-[9px] rounded-[5px] bg-warm overflow-hidden">
        <div className="h-full rounded-[5px]" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <p className="text-[11px] text-faint mt-1.5">{label}</p>
    </div>
  );
}
