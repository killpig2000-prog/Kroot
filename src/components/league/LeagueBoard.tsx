"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LevelCreature from "@/components/dashboard/LevelCreature";
import { treeStageForLevel } from "@/lib/level";

type Row = {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp_week: number;
  is_me: boolean;
  costume_ids?: string[]; // arrives with migration 0015
};
type MyRank = { rank: number; total_players: number; xp_week: number };
type Reward = { coins: number; rank: number; total_players: number; already_claimed: boolean };

// The weekly league board. All reads go through SECURITY DEFINER RPCs from
// migration 0014; until that migration is applied we show a friendly notice
// instead of crashing.
export default function LeagueBoard({ grade }: { grade: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [my, setMy] = useState<MyRank | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    void (async () => {
      const [league, mine] = await Promise.all([
        supabase.rpc("get_weekly_league"),
        supabase.rpc("get_my_weekly_rank"),
      ]);
      if (league.error || mine.error) {
        setUnavailable(true);
        return;
      }
      setRows((league.data ?? []) as Row[]);
      const m = Array.isArray(mine.data) ? mine.data[0] : mine.data;
      setMy(m as MyRank);
    })();
  }, [supabase]);

  async function claim() {
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_weekly_reward");
    setClaiming(false);
    if (error) return;
    const r = Array.isArray(data) ? data[0] : data;
    setReward(r as Reward);
  }

  if (unavailable) {
    return (
      <div className="border border-[#FDE68A] bg-[#FFFBEB] rounded-[14px] px-5 py-4 text-[13.5px]">
        The league opens after database update 0014 is applied.
      </div>
    );
  }

  const pct =
    my && my.total_players > 0 ? Math.max(1, Math.round((my.rank / my.total_players) * 100)) : null;

  return (
    <div className="grid gap-5">
      {/* my standing */}
      <div className="border-[1.5px] border-[#BBF7D0] bg-[#F0FDF4] rounded-[14px] px-5 py-4 flex items-center gap-4 flex-wrap">
        <span className="text-[28px]">🏆</span>
        <div className="flex-1 min-w-[200px]">
          <p className="text-[11px] font-bold tracking-[.08em] uppercase text-[#16A34A]">
            {grade} League · this week
          </p>
          <b className="text-[16px]">
            {my && my.xp_week > 0
              ? `#${my.rank} of ${my.total_players} (top ${pct}%)`
              : "No XP yet this week — one session puts you on the board!"}
          </b>
          {my && my.xp_week > 0 && (
            <span className="block text-[12.5px] text-[#71717A] tabular-nums">
              {my.xp_week} XP this week
            </span>
          )}
        </div>
        <div className="flex-none text-right">
          {reward ? (
            <span className="text-[13.5px] font-bold text-[#16A34A]">
              {reward.already_claimed
                ? `Last week's reward claimed (${reward.coins}🪙)`
                : reward.coins > 0
                  ? `+${reward.coins}🪙 earned!`
                  : "No activity last week"}
            </span>
          ) : (
            <button
              onClick={claim}
              disabled={claiming}
              className="rounded-[9px] px-[16px] py-2 text-[13px] font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors disabled:opacity-60"
            >
              {claiming ? "Checking…" : "Claim last week's reward 🪙"}
            </button>
          )}
        </div>
      </div>

      {/* reward tiers */}
      <div className="flex gap-2 flex-wrap text-[12px] font-semibold">
        <span className="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1">Top 10% → 100🪙</span>
        <span className="rounded-full border border-[#E7E5E4] bg-white px-3 py-1">Top 30% → 50🪙</span>
        <span className="rounded-full border border-[#E7E5E4] bg-white px-3 py-1">Top 60% → 20🪙</span>
        <span className="rounded-full border border-[#E7E5E4] bg-white px-3 py-1">Joined → 5🪙</span>
      </div>

      {/* board */}
      <div className="border border-[#E7E5E4] rounded-[14px] overflow-hidden">
        {rows === null ? (
          <p className="px-5 py-6 text-[13.5px] text-[#A1A1AA]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-6 text-[13.5px] text-[#A1A1AA]">
            Nobody has XP this week yet — first place is wide open!
          </p>
        ) : (
          rows.map((r, i) => (
            <div key={`${r.rank}-${r.display_name}`}>
              {/* rank gap → the "…" divider between top-10 and my window */}
              {i > 0 && r.rank - rows[i - 1].rank > 1 && (
                <div className="border-t border-[#F5F5F4] px-[18px] py-1.5 text-center text-[13px] tracking-[0.3em] text-[#D6D3D1]">
                  ⋯
                </div>
              )}
              <div
                className={`flex items-center gap-3.5 px-[18px] py-3 ${i > 0 ? "border-t border-[#F5F5F4]" : ""} ${
                  r.is_me ? "bg-[#F0FDF4]" : "bg-white"
                }`}
              >
              <span
                className={`flex-none w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold ${
                  r.rank === 1
                    ? "bg-[#FFFBEB] border border-[#FDE68A]"
                    : r.rank <= 3
                      ? "bg-[#FAFAF9] border border-[#E7E5E4]"
                      : "text-[#A1A1AA]"
                }`}
              >
                {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}
              </span>
              <span className="flex-none w-[52px] h-[52px] rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0] overflow-hidden flex items-end justify-center">
                <svg viewBox="30 60 160 160" className="w-[46px] h-[46px]" aria-hidden="true">
                  <LevelCreature level={treeStageForLevel(r.level)} costumeIds={r.costume_ids ?? []} />
                </svg>
              </span>
              <span className="flex-1 min-w-0">
                <b className="block text-[14px] truncate">
                  {r.display_name}
                  {r.is_me && <span className="text-[#16A34A] text-[12px] font-bold ml-1.5">you</span>}
                </b>
                <span className="text-[12px] text-[#A1A1AA]">Lv.{r.level}</span>
              </span>
                <b className="flex-none text-[14px] tabular-nums">{r.xp_week} XP</b>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[12px] text-[#A1A1AA]">
        Rankings compare learners in your grade ({grade}) by XP earned this week (weeks start Monday). You see the top 10 plus the ranks around you, and every Monday you can claim last week&apos;s reward.
      </p>
    </div>
  );
}
