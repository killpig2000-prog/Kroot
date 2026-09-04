"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import LevelCreature from "@/components/dashboard/LevelCreature";
import { treeStageForLevel } from "@/lib/level";
import { SceneLayer, skyFor } from "@/lib/costumes";
import { daysUntilWeekEnd, leagueTier, LEAGUE_TIERS } from "@/lib/league";
import type { CefrLevel } from "@/lib/tree";

type Row = {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp_week: number;
  is_me: boolean;
  costume_ids?: string[];
};
type MyRank = {
  rank: number;
  total_players: number;
  xp_week: number;
  tier: number;
  movement: number; // last week: +1 promoted · -1 demoted · 0 stayed
};
type Reward = { coins: number; rank: number; total_players: number; already_claimed: boolean };

// County-fair rosettes for the podium: blue · red · yellow, in that order.
const RIBBON = [
  { bg: "#3363CC", fg: "#FFFFFF" },
  { bg: "#C13E4A", fg: "#FFFFFF" },
  { bg: "#F4C94F", fg: "#5C4A0E" },
] as const;

// XP a single practice session typically pays (award_xp is capped at 100);
// used only to phrase the nudge as "one session" vs "a couple of sessions".
const SESSION_XP = 30;

function Tree({
  row,
  species,
  size,
  className = "",
}: {
  row: Row;
  species: CefrLevel;
  size: number;
  className?: string;
}) {
  const ids = row.costume_ids ?? [];
  const sky = skyFor(ids);
  return (
    <span
      className={`flex-none rounded-[12px] bg-success-bg border border-success-line overflow-hidden flex items-end justify-center ${className}`}
      style={{ width: size, height: size, ...(sky ? { background: sky } : {}) }}
      aria-hidden="true"
    >
      <svg viewBox="30 60 160 160" style={{ width: size - 6, height: size - 6 }}>
        <SceneLayer costumeIds={ids} layer="behind" />
        <LevelCreature level={treeStageForLevel(row.level)} costumeIds={ids} species={species} />
        <SceneLayer costumeIds={ids} layer="front" />
      </svg>
    </span>
  );
}

// The fair page, one column: a header line (bed chip with last week's move,
// gardeners, days left), last week's coins when they are due, a compact
// podium for the top 3, the board with promotion / stay / demotion dividers,
// and one pinned you-bar (place · the smallest thing that changes it · Learn).
// Data comes from migration 0026's SECURITY DEFINER RPCs; the board only ever
// sees the top 10 plus a ±3 window around the caller.
export default function RankingBoard({ species }: { species: CefrLevel }) {
  const t = useTranslations("ranking");
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [my, setMy] = useState<MyRank | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [joinedThisWeek, setJoinedThisWeek] = useState(false);
  const meRef = useRef<HTMLDivElement>(null);

  // Once the board is in, bring the learner's own row on screen if it sits
  // below the fold (the RPC's top-10 + ±3 window can put it well down the
  // list). Centre it so the zone header above and a neighbour below both
  // show; the podium stays where it was for anyone who scrolls back up.
  // One-shot and instant: an animated scroll would fight a drag that starts
  // mid-animation, and the user asked that nothing hold focus after load.
  useEffect(() => {
    if (!rows || !meRef.current) return;
    const el = meRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= window.innerHeight - 90) return; // already visible above the you-bar
    el.scrollIntoView({ block: "center", behavior: "auto" });
  }, [rows]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Settle any elapsed weeks first so tiers and rankings are this week's.
      const settle = await supabase.rpc("settle_league_weeks");
      if (cancelled) return;
      if (settle.error) {
        setUnavailable(true);
        return;
      }
      const [league, mine, auth] = await Promise.all([
        supabase.rpc("get_weekly_league"),
        supabase.rpc("get_my_weekly_rank"),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      if (league.error || mine.error) {
        setUnavailable(true);
        return;
      }
      setRows((league.data ?? []) as Row[]);
      const m = Array.isArray(mine.data) ? mine.data[0] : mine.data;
      setMy(m as MyRank);

      // Accounts younger than the week have no "last week" to collect.
      const createdAt = auth.data.user?.created_at;
      if (createdAt) {
        const monday = new Date();
        monday.setUTCHours(0, 0, 0, 0);
        monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
        if (new Date(createdAt) >= monday) setJoinedThisWeek(true);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      <div className="border border-amber-line bg-[#FFFBEB] rounded-[14px] px-5 py-4 text-[13.5px] max-w-[560px]">
        {t("unavailable")}
      </div>
    );
  }

  const tierIdx = Math.min(Math.max(my?.tier ?? 0, 0), LEAGUE_TIERS.length - 1);
  const tier = leagueTier(tierIdx);
  const tierLabel = (i: number) => t(`tierName.${LEAGUE_TIERS[i].name}`);
  const total = my?.total_players ?? 0;
  // Mirrors settle_league_weeks: ceil for promotion, floor for demotion.
  const promoteCut = tierIdx < LEAGUE_TIERS.length - 1 ? Math.ceil(total * 0.2) : 0;
  const demoteFrom = tierIdx > 0 ? total - Math.floor(total * 0.2) : Number.POSITIVE_INFINITY;
  const zoneOf = (r: Row): "up" | "stay" | "down" =>
    r.xp_week <= 0 ? "stay" : r.rank <= promoteCut ? "up" : r.rank > demoteFrom ? "down" : "stay";

  const active = (rows ?? []).filter((r) => r.xp_week > 0);
  const podium = active.slice(0, 3);
  const freshWeek = rows !== null && active.length === 0;
  const meRow = rows?.find((r) => r.is_me) ?? null;
  const meIdx = rows?.findIndex((r) => r.is_me) ?? -1;
  const above = meIdx > 0 && rows ? rows[meIdx - 1] : null;
  const below = meIdx >= 0 && rows && meIdx + 1 < rows.length ? rows[meIdx + 1] : null;
  const gapUp = above && meRow ? Math.max(1, above.xp_week - meRow.xp_week + 1) : null;
  const gapDown = below && meRow ? Math.max(0, meRow.xp_week - below.xp_week) : null;
  const daysLeft = daysUntilWeekEnd();
  const placed = !!my && my.xp_week > 0;

  // The nudge: the smallest thing that changes your place.
  let nudge: string;
  if (!placed) nudge = t("nudge.noXp");
  else if (above && gapUp !== null)
    nudge = `${t("nudge.pass", { n: gapUp, name: above.display_name })} ${
      gapUp <= SESSION_XP ? t("nudge.oneSession") : t("nudge.fewSessions")
    }`;
  else if (below && gapDown !== null) nudge = t("nudge.lead", { n: gapDown, name: below.display_name });
  else nudge = t("nudge.leadAlone");

  return (
    <div className="grid gap-3.5 max-w-[560px] min-w-0">
      {/* head: title · bed chip (with last week's move) · gardeners · days left */}
      <div className="grid gap-2">
        <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
          <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FFFBEB] border border-amber-line items-center justify-center text-[15px] mr-[9px]">
            🏅
          </span>
          {t("title")}
        </h1>
        <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap text-[12.5px] font-semibold text-faint">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-0.5 text-[12.5px] font-bold"
            style={{ borderColor: tier.border, background: tier.bg, color: tier.accent }}
          >
            <span aria-hidden="true">{tier.emoji}</span>
            {t("bed", { tier: tierLabel(tierIdx) })}
          </span>
          {my && my.movement !== 0 && (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-black ${
                my.movement > 0 ? "bg-success-bg border-success-line text-success-deep" : "bg-warm border-line text-danger"
              }`}
            >
              {my.movement > 0 ? t("movement.up") : t("movement.down")}
            </span>
          )}
          {total > 0 && <span>{t("head.gardeners", { n: total })}</span>}
          <span className="ml-auto tabular-nums">
            {t("head.daysLeft", { n: daysLeft })} · {t("head.endsSunday")}
          </span>
        </div>
      </div>

      {/* last week's coins — one button while they're due, one line once collected */}
      {rows !== null && !joinedThisWeek && (
        reward ? (
          <p className="text-[13px] font-bold text-success-deep px-1">
            {reward.already_claimed
              ? t("reward.claimed", { coins: reward.coins })
              : reward.coins > 0
                ? t("reward.earned", { coins: reward.coins })
                : t("reward.none")}
          </p>
        ) : (
          <button
            type="button"
            onClick={claim}
            disabled={claiming}
            className="w-full rounded-[11px] px-3 py-2.5 text-[13px] font-bold text-white bg-success shadow-[0_3px_0_#2E5B41] hover:translate-y-px hover:shadow-[0_2px_0_#2E5B41] transition-all disabled:opacity-60"
          >
            {claiming ? t("reward.checking") : t("reward.claim")}
          </button>
        )
      )}

      {/* podium-lite: the top 3 trees, nothing else */}
      <section
        className="relative rounded-[18px] border-[1.5px] border-dashed border-dash px-4 pt-3 pb-0 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #EAF6FF 0%, var(--c-warm, #F6F2E8) 72%)" }}
      >
        {rows === null ? (
          <div className="h-[118px]" />
        ) : podium.length === 0 ? (
          <div className="my-3 flex items-center gap-2.5 border border-amber-line bg-[#FFFBEB] rounded-[12px] px-4 py-2.5 text-[12.5px] font-semibold text-[#B45309]">
            🌅 {t("fair.fresh")}
          </div>
        ) : (
          <div className="grid grid-cols-3 items-end gap-2 md:gap-4 max-w-[420px] mx-auto">
            {/* 2nd · 1st · 3rd — the podium order */}
            {[podium[1], podium[0], podium[2]].map((r, i) => {
              if (!r) return <div key={`empty-${i}`} />;
              const place = r.rank - 1; // 0-based ribbon index
              const size = i === 1 ? 72 : i === 0 ? 58 : 52;
              const lift = i === 1 ? 18 : i === 0 ? 7 : 0;
              const ribbon = RIBBON[Math.min(place, 2)];
              return (
                <div key={r.rank} className="relative flex flex-col items-center gap-0.5" style={{ paddingBottom: lift }}>
                  <span
                    className="absolute -top-1 right-[16%] w-5 h-5 rounded-full grid place-items-center text-[10px] font-black shadow-[0_2px_0_rgba(0,0,0,.15)] z-10"
                    style={{ background: ribbon.bg, color: ribbon.fg }}
                    aria-label={`#${r.rank}`}
                  >
                    {r.rank}
                  </span>
                  <Tree row={r} species={species} size={size} className={r.is_me ? "ring-2 ring-[#ECD98A]" : ""} />
                  <b className="text-[12px] leading-none truncate max-w-full mt-1">
                    {r.display_name}
                    {r.is_me && <span className="text-success text-[10.5px] font-bold ml-1">{t("row.you")}</span>}
                  </b>
                  <span className="text-[11px] text-muted tabular-nums">{t("fair.sun", { n: r.xp_week })}</span>
                  <span className="w-full h-1.5 rounded-t-full bg-[#C9AC7E]/80 mt-0.5" aria-hidden="true" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* the board */}
      <div className="grid gap-1">
        {rows === null ? (
          <p className="px-2 py-5 text-[13.5px] text-faint">{t("zone.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="px-2 py-5 text-[13.5px] text-faint">{t("zone.empty")}</p>
        ) : (
          rows.map((r, i) => {
            const zone = zoneOf(r);
            const prevZone = i > 0 ? zoneOf(rows[i - 1]) : null;
            const gap = i > 0 && r.rank - rows[i - 1].rank > 1;
            const showZone = !freshWeek && (i === 0 || zone !== prevZone);
            return (
              <div key={`${r.rank}-${r.display_name}`} className="grid gap-1">
                {gap && (
                  <div className="py-0.5 text-center text-[13px] tracking-[0.3em] text-faint" aria-hidden="true">
                    ⋯
                  </div>
                )}
                {showZone && (
                  <p
                    className={`flex items-center gap-2 px-1 pt-2 pb-0.5 text-[10.5px] font-black tracking-[.08em] uppercase ${
                      zone === "up" ? "text-success-deep" : zone === "down" ? "text-danger" : "text-faint"
                    }`}
                  >
                    {zone === "up"
                      ? t("zone.up", { tier: tierLabel(Math.min(tierIdx + 1, LEAGUE_TIERS.length - 1)), n: promoteCut })
                      : zone === "down"
                        ? t("zone.down", { tier: tierLabel(Math.max(tierIdx - 1, 0)) })
                        : t("zone.stay", { tier: tierLabel(tierIdx) })}
                    <span
                      className={`flex-1 border-t-[1.5px] border-dashed ${
                        zone === "up" ? "border-success-line" : zone === "down" ? "border-danger/40" : "border-line"
                      }`}
                    />
                  </p>
                )}
                <div
                  ref={r.is_me ? meRef : undefined}
                  className={`grid grid-cols-[22px_46px_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-1.5 rounded-[11px] border text-[13.5px] scroll-mt-24 ${
                    r.is_me
                      ? "bg-[#FEF9C3] border-[#ECD98A] -rotate-[0.4deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)] text-[#2A2622]"
                      : "bg-cream border-line"
                  }`}
                >
                  <span className={`font-black tabular-nums text-[12.5px] ${r.is_me ? "" : "text-faint"}`}>{r.rank}</span>
                  <Tree row={r} species={species} size={46} />
                  <span className="min-w-0">
                    <b className="block truncate">
                      {r.display_name}
                      {r.is_me && <span className="text-success text-[11.5px] font-bold ml-1.5">{t("row.you")}</span>}
                    </b>
                    <small className="block text-[11px] text-faint font-semibold">
                      {t("row.level", { n: r.level })}
                      {r.is_me && above && gapUp !== null && (
                        <> · {t("nudge.pass", { n: gapUp, name: above.display_name })}</>
                      )}
                    </small>
                  </span>
                  <b className="tabular-nums text-[13px] text-success-deep">{t("fair.sun", { n: r.xp_week })}</b>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* the you-bar — place · nudge · Learn, pinned above the phone's bottom nav */}
      {rows !== null && (
        <div className="sticky bottom-[72px] md:bottom-3 z-10 flex items-center gap-2.5 bg-cream/95 backdrop-blur-[6px] border border-line rounded-[12px] px-3.5 py-2.5 text-[12.5px] shadow-[0_10px_24px_-16px_rgba(50,40,20,.5)]">
          {placed && my ? (
            <b className="flex-none tabular-nums text-[13px] text-charcoal">{t("bar.place", { rank: my.rank, total: my.total_players })}</b>
          ) : (
            <span aria-hidden="true">🌱</span>
          )}
          <span className="flex-1 min-w-0 font-semibold text-muted">{nudge}</span>
          <Link
            href="/vocabulary"
            className="flex-none rounded-[9px] bg-success px-3 py-1.5 text-[12.5px] font-bold text-white shadow-[0_3px_0_#2E5B41] hover:translate-y-px hover:shadow-[0_2px_0_#2E5B41] transition-all"
          >
            {t("nudge.learn")}
          </Link>
        </div>
      )}
    </div>
  );
}
