"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { leagueTier } from "@/lib/league";

type MyRank = { rank: number; total_players: number; xp_week: number; tier?: number };

// Compact weekly-league standing for the dashboard rail. Quietly renders a
// plain link if the league RPCs aren't available.
export default function LeagueWidget() {
  const supabase = useMemo(() => createClient(), []);
  const [my, setMy] = useState<MyRank | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await supabase.rpc("settle_league_weeks");
      const { data, error } = await supabase.rpc("get_my_weekly_rank");
      if (!cancelled) {
        if (!error) setMy((Array.isArray(data) ? data[0] : data) as MyRank);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const tier = leagueTier(my?.tier);
  const active = my && my.xp_week > 0;

  return (
    <div>
      {!ready ? (
        <div className="h-[52px]" />
      ) : (
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-[10px] flex-none flex items-center justify-center text-[20px] bg-warm border border-line">
            {tier.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <b className="block text-[13.5px] font-bold">
              {tier.name} league
              {active && (
                <span className="text-success ml-1.5 tabular-nums">
                  #{my.rank} of {my.total_players}
                </span>
              )}
            </b>
            <small className="text-[11.5px] text-muted">
              {active
                ? `${my.xp_week} XP this week — keep climbing!`
                : "No XP yet this week — one session ranks you."}
            </small>
          </div>
        </div>
      )}
      <Link
        href="/league"
        className="block w-full text-center text-[12.5px] font-medium text-muted pt-3 hover:text-charcoal transition-colors"
      >
        Open league →
      </Link>
    </div>
  );
}
