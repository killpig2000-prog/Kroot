"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import LevelCreature from "@/components/dashboard/LevelCreature";
import VeteranTree, { BASE_HEIGHT, veteranFrameHeight } from "@/components/dashboard/VeteranTree";
import { FULLY_GROWN_LEVEL, treeStageForLevel } from "@/lib/level";
import { SceneLayer, skyFor } from "@/lib/costumes";
import { daysUntilWeekEnd, leagueTier, LEAGUE_TIERS } from "@/lib/league";
import TreePeek from "@/components/ranking/TreePeek";
import type { CefrLevel } from "@/lib/tree";

type Row = {
  rank: number;
  user_id: string;
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

// Podium steps and medals: gold · silver · bronze, flat like the rest of the
// app — one fill, one edge, no gloss. The medal is a small pin on the corner
// of the tree box; the step under the tree carries the same colour.
const STEP = [
  { fill: "#F2C94C", edge: "#B7861A", ink: "#5C4A0E", h: 26 },
  { fill: "#D3D8E0", edge: "#8E96A3", ink: "#374151", h: 18 },
  { fill: "#D08A55", edge: "#8F5A32", ink: "#4A2E14", h: 12 },
] as const;

function Medal({ place, rank }: { place: 0 | 1 | 2; rank: number }) {
  const m = STEP[place];
  return (
    <svg viewBox="0 0 24 30" width="24" height="30" aria-hidden="true">
      <path d="M7 0 L12 9 L5 12 L3 1 Z" fill="#D9342B" />
      <path d="M17 0 L12 9 L19 12 L21 1 Z" fill="#2F5FBF" />
      <circle cx="12" cy="19" r="10" fill={m.fill} stroke={m.edge} strokeWidth="1.5" />
      <circle cx="12" cy="19" r="7" fill="none" stroke={m.edge} strokeWidth="1" opacity=".55" />
      <text x="12" y="22.5" textAnchor="middle" fontSize="10" fontWeight="900" fill={m.ink} fontFamily="ui-rounded, system-ui, sans-serif">
        {rank}
      </text>
    </svg>
  );
}

// XP a single practice session typically pays (award_xp is capped at 100);
// used only to phrase the nudge as "one session" vs "a couple of sessions".
const SESSION_XP = 30;

// A thumbnail draws the whole tree to scale — a Lv.120 tree is more than
// twice the height of a Lv.50 one, so it comes out narrow and small in the
// same box, which is exactly what says "that one is tall" at a glance.
// Every thumbnail is a button that opens TreePeek with the tree at full size.
function Tree({
  row,
  species,
  size,
  className = "",
  onOpen,
}: {
  row: Row;
  species: CefrLevel;
  /** Box side — a px number, or any CSS length (the podium uses clamp()). */
  size: number | string;
  className?: string;
  onOpen: (row: Row) => void;
}) {
  const ids = row.costume_ids ?? [];
  const sky = skyFor(ids);
  const veteran = row.level >= FULLY_GROWN_LEVEL;
  const frameH = veteran ? veteranFrameHeight(row.level) : BASE_HEIGHT;
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      aria-label={row.display_name}
      className={`flex-none rounded-[12px] bg-success-bg border border-success-line overflow-hidden flex items-end justify-center cursor-zoom-in hover:brightness-105 active:scale-95 transition ${className}`}
      style={{ width: size, height: size, ...(sky ? { background: sky } : {}) }}
    >
      {/* Full frame (220 × the level's height), fitted by height: the SVG keeps
          its aspect, so a taller tree draws smaller inside the same box. */}
      <svg viewBox={`0 0 220 ${frameH}`} style={{ height: "calc(100% - 4px)", width: "auto", maxWidth: "calc(100% - 4px)" }}>
        <SceneLayer costumeIds={ids} layer="behind" />
        {veteran ? (
          <VeteranTree level={row.level} species={species} costumeIds={ids} />
        ) : (
          <LevelCreature level={treeStageForLevel(row.level)} costumeIds={ids} species={species} />
        )}
        <SceneLayer costumeIds={ids} layer="front" />
      </svg>
    </button>
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
  // Shown once, the moment claim_weekly_reward() actually pays something out
  // for the first time — never again for the same week (already_claimed
  // flips true server-side the instant that call returns), and never on a
  // plain page reload, which used to bring back a "Collect" button that
  // looked unclaimed even though the RPC had already paid it.
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  // Garden beds (tiers) are switched off while the player base is small —
  // one board for everyone, no bed chip, no move-up/down zones. The switch
  // lives in league_settings (migration 0069); true is assumed until read so
  // an environment without the table behaves as before.
  const [bedsEnabled, setBedsEnabled] = useState(true);
  const [peek, setPeek] = useState<Row | null>(null);
  const [unavailable, setUnavailable] = useState(false);
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
      const [league, mine, auth, settings] = await Promise.all([
        supabase.rpc("get_weekly_league"),
        supabase.rpc("get_my_weekly_rank"),
        supabase.auth.getUser(),
        supabase.from("league_settings").select("beds_enabled").maybeSingle(),
      ]);
      if (cancelled) return;
      if (league.error || mine.error) {
        setUnavailable(true);
        return;
      }
      if (!settings.error && settings.data) setBedsEnabled(!!settings.data.beds_enabled);
      setRows((league.data ?? []) as Row[]);
      const m = Array.isArray(mine.data) ? mine.data[0] : mine.data;
      setMy(m as MyRank);

      // Accounts younger than the week have no "last week" to collect.
      const createdAt = auth.data.user?.created_at;
      let justJoined = false;
      if (createdAt) {
        const monday = new Date();
        monday.setUTCHours(0, 0, 0, 0);
        monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
        justJoined = new Date(createdAt) >= monday;
      }

      // claim_weekly_reward() is idempotent — the first call for a week pays
      // out and returns already_claimed: false; every call after that just
      // reports the same row with already_claimed: true and pays nothing
      // twice. Calling it here, on every board load, replaces the old
      // "Collect" button: there's nothing left to press, and nothing that
      // can go stale across a refresh.
      if (!justJoined) {
        const { data, error } = await supabase.rpc("claim_weekly_reward");
        if (cancelled) return;
        if (!error) {
          const r = Array.isArray(data) ? data[0] : data;
          setReward(r as Reward);
          if (r && !r.already_claimed && r.coins > 0) setShowRewardPopup(true);
        } else {
          // Best effort: a failed call here just means next load tries
          // again, not a stuck flow — there's no button whose state would
          // otherwise get stranded.
          console.error("claim_weekly_reward failed:", error.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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
  // The board below starts where the podium ends — a top-3 gardener is on
  // the podium, not repeated as a row.
  const listRows = rows ? rows.filter((r) => !podium.some((p) => p.rank === r.rank)) : null;
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
      {peek && (
        <TreePeek
          name={peek.display_name}
          rank={peek.rank}
          avatarUrl={peek.avatar_url}
          level={peek.level}
          xpWeek={peek.xp_week}
          species={species}
          costumeIds={peek.costume_ids ?? []}
          isMe={peek.is_me}
          onClose={() => setPeek(null)}
        />
      )}
      {/* head: title · bed chip (with last week's move) · gardeners · days left */}
      <div className="grid gap-2">
        <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
          <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FFFBEB] border border-amber-line items-center justify-center text-[15px] mr-[9px]">
            🏅
          </span>
          {t("title")}
        </h1>
        <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap text-[12.5px] font-semibold text-faint">
          {bedsEnabled && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-0.5 text-[12.5px] font-bold"
              style={{ borderColor: tier.border, background: tier.bg, color: tier.accent }}
            >
              <span aria-hidden="true">{tier.emoji}</span>
              {t("bed", { tier: tierLabel(tierIdx) })}
            </span>
          )}
          {bedsEnabled && my && my.movement !== 0 && (
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
              const place = Math.min(r.rank - 1, 2); // 0-based step index
              // Scales with the phone: ~30vw for the winner down to a 360px
              // screen, capped so a tablet doesn't get a billboard.
              const size = i === 1 ? "clamp(84px, 30vw, 124px)" : i === 0 ? "clamp(70px, 25vw, 102px)" : "clamp(64px, 23vw, 94px)";
              const step = STEP[place];
              return (
                <div key={r.rank} className="relative flex flex-col items-center gap-0.5">
                  {/* medal pinned to the box's top-right corner */}
                  <span className="absolute -top-2 right-[10%] z-10 leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,.2)]" aria-label={`#${r.rank}`}>
                    <Medal place={place as 0 | 1 | 2} rank={r.rank} />
                  </span>
                  <Tree row={r} species={species} size={size} className={r.is_me ? "ring-2 ring-[#ECD98A]" : ""} onOpen={setPeek} />
                  <b className="text-[12px] leading-none truncate max-w-full mt-1">
                    {r.display_name}
                    {r.is_me && <span className="text-success text-[10.5px] font-bold ml-1">{t("row.you")}</span>}
                  </b>
                  <span className="text-[11px] text-muted tabular-nums">{t("fair.sun", { n: r.xp_week })}</span>
                  {/* the step: gold / silver / bronze, 1st the tallest */}
                  <span
                    className="w-full rounded-t-[8px] mt-1"
                    style={{ height: step.h, background: step.fill, borderTop: `1.5px solid ${step.edge}` }}
                    aria-hidden="true"
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* the board */}
      <div className="grid gap-1">
        {listRows === null ? (
          <p className="px-2 py-5 text-[13.5px] text-faint">{t("zone.loading")}</p>
        ) : rows && rows.length === 0 ? (
          <p className="px-2 py-5 text-[13.5px] text-faint">{t("zone.empty")}</p>
        ) : (
          listRows.map((r, i) => {
            const zone = zoneOf(r);
            const prevZone = i > 0 ? zoneOf(listRows[i - 1]) : null;
            const gap = i > 0 && r.rank - listRows[i - 1].rank > 1;
            const showZone = bedsEnabled && !freshWeek && (i === 0 || zone !== prevZone);
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
                  className={`grid grid-cols-[22px_66px_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-1.5 rounded-[11px] border text-[13.5px] scroll-mt-24 ${
                    r.is_me
                      ? "bg-[#FEF9C3] border-[#ECD98A] -rotate-[0.4deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)] text-[#2A2622]"
                      : "bg-cream border-line"
                  }`}
                >
                  <span className={`font-black tabular-nums text-[12.5px] ${r.is_me ? "" : "text-faint"}`}>{r.rank}</span>
                  <Tree row={r} species={species} size={66} onOpen={setPeek} />
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

      {/* One-time popup: last week's board just paid out, right now. Same
          full-screen dialog treatment as TreeGrowthPopup. */}
      {showRewardPopup && reward && (
        <>
          <button
            aria-label={t("reward.closeAria")}
            onClick={() => setShowRewardPopup(false)}
            className="fixed inset-0 z-[60] bg-[#282319]/45 cursor-default"
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("reward.dialogAria")}
              className="pointer-events-auto w-full max-w-[380px] bg-cream rounded-[24px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.35)] px-8 pt-9 pb-8 text-center"
            >
              <span aria-hidden="true" className="block text-[44px] mb-2">
                🪙
              </span>
              <b className="block text-[13px] font-extrabold tracking-[.08em] uppercase text-success mb-1">
                {t("reward.popupEyebrow")}
              </b>
              <p className="text-[21px] font-extrabold text-charcoal mb-5 tracking-tight">
                {t("reward.earned", { coins: reward.coins })}
              </p>
              <button
                onClick={() => setShowRewardPopup(false)}
                className="w-full rounded-[13px] bg-success text-white font-bold text-[14.5px] py-3.5 hover:bg-success-deep transition-colors"
              >
                {t("reward.ok")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
