"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type MyRank = { rank: number; total_players: number; xp_week: number };

// Compact weekly-league standing for the My growth page. Quietly renders
// nothing if the league RPCs aren't available yet.
export default function RankCard({ grade }: { grade: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [my, setMy] = useState<MyRank | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.rpc("get_my_weekly_rank");
      if (!error) setMy((Array.isArray(data) ? data[0] : data) as MyRank);
      setReady(true);
    })();
  }, [supabase]);

  if (!ready) {
    return <div className="border border-[#E3DDD0] rounded-[14px] px-5 py-4 min-h-[74px]" />;
  }

  const active = my && my.xp_week > 0;
  const pct =
    active && my.total_players > 0
      ? Math.max(1, Math.round((my.rank / my.total_players) * 100))
      : null;

  return (
    <Link
      href="/league"
      className="border border-[#E3DDD0] rounded-[14px] px-5 py-4 block hover:border-[#16A34A] transition-colors"
    >
      <b className="block text-[20px] font-bold tracking-[-0.02em] tabular-nums">
        {active ? `#${my.rank}` : "—"}
        {pct !== null && (
          <span className="text-[12px] font-semibold text-[#16A34A] ml-1.5">top {pct}%</span>
        )}
      </b>
      <small className="text-[12.5px] text-[#6B6560]">
        {active ? `${grade} league this week →` : `${grade} league — earn XP to rank →`}
      </small>
    </Link>
  );
}
