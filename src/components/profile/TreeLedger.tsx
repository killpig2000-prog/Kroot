import { getTranslations } from "next-intl/server";

// "What grew your tree" — the XP of a period, split by where it came from
// (xp_events.points + .skill).
//
// The tree IS the product here, so this card is its ledger: it answers "the
// tree is this tall — what made it grow?" in a way no generic study app can.
// Skills are nominal categories, so they share one data colour and are
// compared by bar length; six hues would encode a ranking that isn't there.
// Rows are sorted biggest-first, which is the only ranking that is real.
export type LedgerRow = { key: string; label: string; points: number };

export default async function TreeLedger({ rows, total }: { rows: LedgerRow[]; total: number }) {
  const t = await getTranslations("profile.learn");
  const max = Math.max(1, ...rows.map((r) => r.points));

  return (
    <div className="border border-line rounded-[14px] bg-cream px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <b className="font-semibold text-[14px]">{t("ledgerTitle")}</b>
        <span className="text-[12.5px] text-muted tabular-nums">{t("ledgerTotal", { n: total })}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-[12.5px] text-muted">{t("ledgerEmpty")}</p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li key={r.key} className="grid grid-cols-[minmax(56px,26%)_minmax(0,1fr)_auto] items-center gap-2.5">
              <span className="text-[12.5px] truncate">{r.label}</span>
              <span className="h-[9px] rounded-full bg-warm-3 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-success"
                  style={{ width: `${Math.max(3, (r.points / max) * 100)}%` }}
                />
              </span>
              <span className="text-[11.5px] text-muted tabular-nums w-[44px] text-right">{r.points}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
