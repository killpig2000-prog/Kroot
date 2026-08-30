import { Link } from "@/i18n/navigation";
import {
  CHALLENGES,
  KIND_LABEL,
  totalStarsPossible,
  type Challenge,
  type ChallengeResult,
} from "@/lib/pronunciation";

export type ChallengeState = {
  challenge: Challenge;
  best: ChallengeResult | null;
  stars: 0 | 1 | 2 | 3;
  locked: boolean;
  /** Why it's locked, in one short line. */
  lockNote?: string;
};

function Stars({ n }: { n: number }) {
  return (
    <span className="tracking-[1px] text-[#D9A23B]" aria-label={`${n} of 3 stars`}>
      {"★".repeat(n)}
      <span className="text-line">{"★".repeat(3 - n)}</span>
    </span>
  );
}

export default function ChallengeList({ items }: { items: ChallengeState[] }) {
  const earned = items.reduce((n, i) => n + i.stars, 0);
  const cleared = items.filter((i) => i.stars > 0).length;
  const bestAccuracy = items.reduce((n, i) => Math.max(n, i.best?.accuracy ?? 0), 0);

  return (
    <div className="max-w-[880px]">
      {/* the scoring rules, stated once — no hero box */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4 px-1">
        <div className="flex gap-4 flex-wrap text-[12.5px] font-bold">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">🎯</span> Accuracy earns ★★
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">⏱</span> Beat the clock for ★★★
          </span>
          <span className="text-muted font-semibold">Retries never count against you</span>
        </div>
        <div className="flex gap-3.5 text-[12.5px] text-muted tabular-nums">
          <span>
            <b className="text-charcoal">{earned}</b>/{totalStarsPossible()} ★
          </span>
          <span>
            <b className="text-charcoal">{cleared}</b> cleared
          </span>
          {bestAccuracy > 0 && (
            <span>
              best <b className="text-charcoal">{bestAccuracy}%</b>
            </span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {items.map(({ challenge: c, best, stars, locked, lockNote }) => {
          const body = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold tracking-[.08em] uppercase text-muted">
                  {KIND_LABEL[c.kind]}
                </span>
                <span className="text-[12px] tracking-[1px]" aria-label={`difficulty ${c.heat} of 5`}>
                  {"🔥".repeat(c.heat)}
                </span>
              </div>
              <h3 className="font-extrabold text-[15.5px] tracking-[-0.01em]">
                {c.title}
                <span className="kr block text-[16px] font-bold mt-1 leading-snug">{c.kr}</span>
              </h3>
              <div className="mt-auto pt-2 border-t border-dashed border-dash flex items-center justify-between gap-2">
                <span className="text-[12px] text-muted tabular-nums flex items-center gap-1.5">
                  <Stars n={stars} />
                  {best ? (
                    <>
                      · <b className="text-charcoal">{best.accuracy}%</b>
                      {best.ms > 0 && ` in ${(best.ms / 1000).toFixed(1)}s`}
                    </>
                  ) : locked ? null : (
                    <span className="text-faint">· not tried</span>
                  )}
                </span>
                <span
                  className={`text-[12.5px] font-extrabold flex-none ${
                    locked ? "text-faint" : "text-[var(--c-danger)]"
                  }`}
                >
                  {locked ? "Locked" : best ? "Retry →" : "Start →"}
                </span>
              </div>
              {locked && lockNote && (
                <p className="text-[11.5px] text-faint">🔒 {lockNote}</p>
              )}
            </>
          );

          const cls =
            "flex flex-col gap-2 rounded-[14px] border-[1.5px] border-line bg-cream px-4 py-3.5 transition-transform";

          return locked ? (
            <div key={c.key} className={`${cls} opacity-60`} aria-disabled="true">
              {body}
            </div>
          ) : (
            <Link
              key={c.key}
              href={`/speaking?challenge=${c.key}`}
              className={`${cls} hover:-translate-y-0.5 hover:border-[var(--tint-rose-line)]`}
            >
              {body}
            </Link>
          );
        })}
      </div>

      {items.length < CHALLENGES.length && (
        <p className="text-[12px] text-faint mt-3">More challenges unlock as you practice.</p>
      )}
    </div>
  );
}
