import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// The period the whole page reads: 30 days / 3 months / all time.
//
// It lives in the URL rather than in React state so the page stays a server
// component — every card is recomputed from the same window on the server,
// and a shared link keeps the period it was read in.
export const PERIODS = ["30", "90", "all"] as const;
export type Period = (typeof PERIODS)[number];

export function asPeriod(v: string | undefined): Period {
  return (PERIODS as readonly string[]).includes(v ?? "") ? (v as Period) : "30";
}

/** Days in the window, or null for all time. */
export function periodDays(p: Period): number | null {
  return p === "all" ? null : Number(p);
}

export default async function PeriodTabs({ current }: { current: Period }) {
  const t = await getTranslations("profile.learn");
  const label: Record<Period, string> = {
    "30": t("period30"),
    "90": t("period90"),
    all: t("periodAll"),
  };

  return (
    <div className="flex gap-1.5" role="group" aria-label={t("periodLabel")}>
      {PERIODS.map((p) => {
        const on = p === current;
        return (
          <Link
            key={p}
            href={p === "30" ? "/profile" : `/profile?p=${p}`}
            scroll={false}
            aria-current={on ? "true" : undefined}
            className={`rounded-full border px-3 py-[5px] text-[12px] transition-colors ${
              on
                ? "bg-success-deep border-success-deep text-cream font-bold"
                : "bg-cream border-line text-muted hover:border-success"
            }`}
          >
            {label[p]}
          </Link>
        );
      })}
    </div>
  );
}
