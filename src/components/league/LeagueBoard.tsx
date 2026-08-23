"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LevelCreature from "@/components/dashboard/LevelCreature";
import { treeStageForLevel } from "@/lib/level";
import { leagueTier, LEAGUE_TIERS } from "@/lib/league";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

type Row = {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp_week: number;
  is_me: boolean;
  costume_ids?: string[]; // arrives with migration 0015
};
type MyRank = {
  rank: number;
  total_players: number;
  xp_week: number;
  tier: number;
  movement: number; // last week: +1 promoted · -1 demoted · 0 stayed
};
type Reward = { coins: number; rank: number; total_players: number; already_claimed: boolean };

// The weekly league board: activity-based tiers (Sprout → Diamond), ranked by
// this week's XP. All reads go through SECURITY DEFINER RPCs from migration
// 0026; until that migration is applied we show a friendly notice instead of
// crashing. `grade` only picks the tree species for the creatures.
export default function LeagueBoard({ grade }: { grade: string }) {
  const species = (LEVEL_ORDER as readonly string[]).includes(grade) ? (grade as CefrLevel) : undefined;
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [my, setMy] = useState<MyRank | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [joinedThisWeek, setJoinedThisWeek] = useState(false);

  useEffect(() => {
    void (async () => {
      // Settle any elapsed weeks first so tiers/rankings reflect the new week.
      const settle = await supabase.rpc("settle_league_weeks");
      if (settle.error) {
        setUnavailable(true);
        return;
      }
      const [league, mine, auth] = await Promise.all([
        supabase.rpc("get_weekly_league"),
        supabase.rpc("get_my_weekly_rank"),
        supabase.auth.getUser(),
      ]);
      if (league.error || mine.error) {
        setUnavailable(true);
        return;
      }
      setRows((league.data ?? []) as Row[]);
      const m = Array.isArray(mine.data) ? mine.data[0] : mine.data;
      setMy(m as MyRank);

      // No "claim last week" button for accounts younger than the week —
      // there is no last week to claim.
      const createdAt = auth.data.user?.created_at;
      if (createdAt) {
        const monday = new Date();
        monday.setHours(0, 0, 0, 0);
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        if (new Date(createdAt) >= monday) setJoinedThisWeek(true);
      }
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
        The league opens after database update 0026 is applied.
      </div>
    );
  }

  const tier = leagueTier(my?.tier);
  const tierIdx = Math.min(Math.max(my?.tier ?? 0, 0), LEAGUE_TIERS.length - 1);
  const pct =
    my && my.total_players > 0 ? Math.max(1, Math.round((my.rank / my.total_players) * 100)) : null;

  // Promotion/demotion zones over active players (mirrors settle_league_weeks:
  // ceil for promotion, floor for demotion).
  const total = my?.total_players ?? 0;
  const promoteCut = tierIdx < LEAGUE_TIERS.length - 1 ? Math.ceil(total * 0.2) : 0;
  const demoteFrom = tierIdx > 0 ? total - Math.floor(total * 0.2) : Number.POSITIVE_INFINITY;

  return (
    <div className="grid gap-5">
      {/* last week's movement */}
      {my && my.movement !== 0 && (
        <div
          className="border-[1.5px] rounded-[14px] px-5 py-3 text-[13.5px] font-semibold"
          style={
            my.movement > 0
              ? { borderColor: tier.border, background: tier.bg, color: tier.accent }
              : { borderColor: "#FECACA", background: "#FEF2F2", color: "#B91C1C" }
          }
        >
          {my.movement > 0
            ? `Promoted! You climbed to the ${tier.name} league ${tier.emoji}`
            : `You dropped to the ${tier.name} league — one strong week climbs right back ${tier.emoji}`}
        </div>
      )}

      {/* my standing */}
      <div className="border-[1.5px] border-[#BBF7D0] bg-[#F0FDF4] rounded-[14px] px-5 py-4 flex items-center gap-4 flex-wrap">
        <span className="text-[28px]">{tier.emoji}</span>
        <div className="flex-1 min-w-[200px]">
          <p className="text-[11px] font-bold tracking-[.08em] uppercase text-[#16A34A]">
            {tier.name} League · this week
          </p>
          <b className="text-[16px]">
            {my && my.xp_week > 0
              ? `#${my.rank} of ${my.total_players} (top ${pct}%)`
              : "No XP yet this week — one session puts you on the board!"}
          </b>
          {my && my.xp_week > 0 && (
            <span className="block text-[12.5px] text-[#6B6560] tabular-nums">
              {my.xp_week} XP this week
            </span>
          )}
        </div>
        <div className="flex-none text-right">
          {joinedThisWeek ? (
            <span className="text-[13px] font-semibold text-[#6B6560]">
              First week — rewards unlock Monday 🌱
            </span>
          ) : reward ? (
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

      {/* tier ladder */}
      <div className="flex gap-2 flex-wrap text-[12px] font-semibold items-center">
        {LEAGUE_TIERS.map((t, i) => (
          <span
            key={t.name}
            className="rounded-full border px-3 py-1"
            style={
              i === tierIdx
                ? { borderColor: t.border, background: t.bg, color: t.accent }
                : { borderColor: "#E3DDD0", background: "#fff", color: "#A19A8C" }
            }
          >
            {t.emoji} {t.name}
          </span>
        ))}
      </div>

      {/* reward tiers */}
      <div className="flex gap-2 flex-wrap text-[12px] font-semibold">
        <span className="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1">Top 10% → 100🪙</span>
        <span className="rounded-full border border-[#E3DDD0] bg-white px-3 py-1">Top 30% → 50🪙</span>
        <span className="rounded-full border border-[#E3DDD0] bg-white px-3 py-1">Top 60% → 20🪙</span>
        <span className="rounded-full border border-[#E3DDD0] bg-white px-3 py-1">Joined → 5🪙</span>
      </div>

      {/* board */}
      <div className="border border-[#E3DDD0] rounded-[14px] overflow-hidden">
        {rows === null ? (
          <p className="px-5 py-6 text-[13.5px] text-[#A19A8C]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-6 text-[13.5px] text-[#A19A8C]">
            Nobody has XP this week yet — first place is wide open!
          </p>
        ) : (
          rows.map((r, i) => {
            const inPromoteZone = r.xp_week > 0 && r.rank <= promoteCut;
            const inDemoteZone = r.xp_week > 0 && r.rank > demoteFrom;
            return (
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
                      ? "bg-[#FAF7EF] border border-[#E3DDD0]"
                      : "text-[#A19A8C]"
                }`}
              >
                {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}
              </span>
              <span className="flex-none w-[52px] h-[52px] rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0] overflow-hidden flex items-end justify-center">
                <svg viewBox="30 60 160 160" className="w-[46px] h-[46px]" aria-hidden="true">
                  <LevelCreature level={treeStageForLevel(r.level)} costumeIds={r.costume_ids ?? []} species={species} />
                </svg>
              </span>
              <span className="flex-1 min-w-0">
                <b className="block text-[14px] truncate">
                  {r.display_name}
                  {r.is_me && <span className="text-[#16A34A] text-[12px] font-bold ml-1.5">you</span>}
                </b>
                <span className="text-[12px] text-[#A19A8C]">Lv.{r.level}</span>
              </span>
                {inPromoteZone && (
                  <span className="flex-none text-[12px] font-bold text-[#16A34A]" title="Promotion zone">
                    ▲
                  </span>
                )}
                {inDemoteZone && (
                  <span className="flex-none text-[12px] font-bold text-[#DC2626]" title="Demotion zone">
                    ▼
                  </span>
                )}
                <b className="flex-none text-[14px] tabular-nums">{r.xp_week} XP</b>
              </div>
            </div>
            );
          })
        )}
      </div>

      <p className="text-[12px] text-[#A19A8C]">
        Everyone in the {tier.name}{" "}league races by XP earned this week (weeks start Monday). Each
        Monday the top 20% (▲) climb to the next league, the bottom 20% (▼) drop one, and you can
        claim last week&apos;s reward. You see the top 10 plus the ranks around you.
      </p>
    </div>
  );
}
