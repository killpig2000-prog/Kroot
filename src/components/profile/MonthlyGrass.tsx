// GitHub-style contribution grass for the current calendar year
// (Jan 1 – Dec 31). Server component: pure markup from daily_activity data.

const CELL_COLORS = ["#F0EFED", "#BBF7D0", "#6BBF8A", "#16A34A", "#15803D"];

function shade(minutes: number): string {
  if (minutes <= 0) return CELL_COLORS[0];
  if (minutes < 10) return CELL_COLORS[1];
  if (minutes < 20) return CELL_COLORS[2];
  if (minutes < 40) return CELL_COLORS[3];
  return CELL_COLORS[4];
}

export default function MonthlyGrass({
  minutesByDate,
  headline,
}: {
  minutesByDate: Map<string, number>;
  headline: { label: string; value: string }[];
}) {
  // The full current calendar year, columns = weeks (Mon–Sun rows).
  const today = new Date();
  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const start = new Date(jan1);
  start.setDate(jan1.getDate() - ((jan1.getDay() + 6) % 7)); // Monday on/before Jan 1
  const end = new Date(dec31);
  end.setDate(dec31.getDate() + (6 - ((dec31.getDay() + 6) % 7))); // Sunday on/after Dec 31
  const weeks = Math.round((end.getTime() - start.getTime() + 86_400_000) / (7 * 86_400_000));

  type Cell = { date: string; minutes: number; future: boolean; inYear: boolean };
  const cols: Cell[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const col: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10);
      col.push({
        date: iso,
        minutes: minutesByDate.get(iso) ?? 0,
        future: cursor > today,
        inYear: cursor >= jan1 && cursor <= dec31,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    cols.push(col);
  }

  // Label a column when the 1st of a month falls inside it.
  const monthLabels = cols.map((col) => {
    const firstOfMonth = col.find((c) => c.inYear && new Date(c.date).getDate() === 1);
    return firstOfMonth
      ? new Date(firstOfMonth.date).toLocaleDateString("en-US", { month: "short" })
      : "";
  });

  return (
    <div className="border border-line rounded-[14px] px-[22px] py-5">
      <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
        <b className="font-semibold text-[15px]">🌿 Study garden · {year}</b>
        <div className="flex gap-2 flex-wrap">
          {headline.map((h) => (
            <span
              key={h.label}
              className="text-[12px] font-semibold text-[#3F3F46] bg-warm border border-line rounded-full px-2.5 py-[3px] tabular-nums"
            >
              {h.value} <span className="text-faint font-medium">{h.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-[2px]">
          <div className="flex gap-[2px] text-[9px] text-faint h-[11px]">
            {monthLabels.map((m, i) => (
              <span key={i} className="w-[11px] leading-[11px] overflow-visible whitespace-nowrap">
                {m}
              </span>
            ))}
          </div>
          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} className="flex gap-[2px]">
              {cols.map((col, i) => (
                <span
                  key={i}
                  title={`${col[row].date} · ${col[row].minutes} min`}
                  className="w-[11px] h-[11px] rounded-[3px]"
                  style={{
                    background: !col[row].inYear
                      ? "transparent"
                      : col[row].future
                        ? "#F9F8F7"
                        : shade(col[row].minutes),
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-[11px] text-faint">
        less
        {CELL_COLORS.map((c) => (
          <span key={c} className="w-[10px] h-[10px] rounded-[3px]" style={{ background: c }} />
        ))}
        more
      </div>
    </div>
  );
}
