"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

// "Your best hours" — hour-of-day distribution of study sessions.
//
// CLIENT-ONLY ON PURPOSE: the server has no idea what timezone the reader is
// in, so bucketing the UTC timestamps server-side would file a 9pm Seoul
// session under noon. The raw ISO strings come down untouched and are
// bucketed with the browser's own clock after mount (bucketing during the
// first render would also mismatch the server HTML and blow up hydration).

const H = 56;
const SLOT = 10;
const STUB = 2;

/** never changes after mount, so the store never needs to notify */
const subscribeNever = () => () => {};

export default function BestHours({ timestamps }: { timestamps: string[] }) {
  const t = useTranslations("ui.account");
  // false on the server and through hydration, true afterwards — the bars can
  // only be bucketed once the browser's clock is the one doing the reading.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  const buckets = useMemo(() => {
    if (!mounted) return null;
    const counts = Array.from({ length: 24 }, () => 0);
    for (const ts of timestamps) {
      const d = new Date(ts);
      if (!Number.isNaN(d.getTime())) counts[d.getHours()] += 1;
    }
    return counts;
  }, [mounted, timestamps]);

  const hourLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { hour: "numeric" });
    return (h: number) => fmt.format(new Date(2020, 0, 1, h, 0, 0));
  }, []);

  const peak = buckets ? buckets.indexOf(Math.max(...buckets)) : -1;
  const max = buckets ? Math.max(...buckets, 1) : 1;

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3.5 flex-wrap">
        <b className="font-semibold text-[15px]">{t("bestHours")}</b>
        {buckets && peak >= 0 && (
          <small className="text-[12.5px] text-faint font-medium tabular-nums">
            {t("peakHour", { hour: hourLabel(peak) })}
          </small>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${24 * SLOT} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-[56px] min-w-[240px] block"
          role="img"
          aria-label={t("bestHours")}
        >
          {(buckets ?? Array.from({ length: 24 }, () => 0)).map((count, h) => {
            const height = count > 0 ? Math.max(STUB, Math.round((count / max) * H)) : STUB;
            // only the peak and its neighbours carry the data colour — the
            // point of this chart is where the peak sits, not 24 categories
            const near = peak >= 0 && Math.abs(h - peak) <= 1;
            return (
              <rect
                key={h}
                x={h * SLOT}
                y={H - height}
                width={SLOT - 4}
                height={height}
                fill={near && count > 0 ? "var(--c-chart)" : "var(--c-chart-dim)"}
              >
                <title>{t("sessionsAt", { hour: hourLabel(h), count })}</title>
              </rect>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between mt-2 text-[11px] text-faint tabular-nums">
        <span>{hourLabel(0)}</span>
        <span>{hourLabel(12)}</span>
        <span>{hourLabel(23)}</span>
      </div>
    </div>
  );
}
