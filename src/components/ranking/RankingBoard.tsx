"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { playPromote } from "@/lib/sfx";
import LevelCreature from "@/components/dashboard/LevelCreature";
import VeteranTree, { BASE_HEIGHT, veteranFrameHeight } from "@/components/dashboard/VeteranTree";
import { FULLY_GROWN_LEVEL, treeStageForLevel } from "@/lib/level";
import { SceneLayer, skyFor } from "@/lib/costumes";
import { buildWeeks, xpByDayFrom, type WeekRing } from "@/lib/growth-rings";
import { daysUntilWeekEnd } from "@/lib/league";
import TreePeek from "@/components/ranking/TreePeek";
import GardenScene from "@/components/ui/GardenScene";
import type { CefrLevel } from "@/lib/tree";

type Row = {
  rank: number;
  total_players: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  xp_week: number;
  is_me: boolean;
  costume_ids?: string[];
};
type RingDay = { day: string; attended: boolean; studied: boolean; reviewed: boolean; xp: number };
type Reward = { coins: number; rank: number; total_players: number; already_claimed: boolean };

// Podium medals: gold · silver · bronze, flat like the rest of the app.
const STEP = [
  { fill: "#F2C94C", edge: "#B7861A", ink: "#5C4A0E" },
  { fill: "#D3D8E0", edge: "#8E96A3", ink: "#374151" },
  { fill: "#D08A55", edge: "#8F5A32", ink: "#4A2E14" },
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
function Tree({
  row,
  species,
  size,
  className = "",
  bare = false,
  onOpen,
}: {
  row: Row;
  species: CefrLevel;
  size: number | string;
  className?: string;
  bare?: boolean;
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
      className={`flex-none flex items-end justify-center cursor-zoom-in hover:brightness-105 active:scale-95 transition ${
        bare ? "overflow-visible" : "overflow-hidden rounded-[12px] bg-success-bg border border-success-line"
      } ${className}`}
      style={{ width: size, height: size, ...(sky && !bare ? { background: sky } : {}) }}
    >
      {/* The tallest looks (spirit tree, 218 tall on a 212 ground line) rise
          above the 230-unit frame; on the bare podium let them, or the
          canopy's top gets cut off (2026-09-12). Boxed rows still clip. */}
      <svg viewBox={`0 0 220 ${frameH}`} className={bare ? "overflow-visible" : ""} style={{ height: "calc(100% - 4px)", width: "auto", maxWidth: "calc(100% - 4px)" }}>
        <SceneLayer costumeIds={ids} layer="behind" />
        {veteran ? (
          <VeteranTree level={row.level} species={species} costumeIds={ids} />
        ) : (
          <LevelCreature level={treeStageForLevel(row.level)} playerLevel={row.level} costumeIds={ids} species={species} />
        )}
        <SceneLayer costumeIds={ids} layer="front" />
      </svg>
    </button>
  );
}

// The board, one column (2026-09-10, "누적 XP로, 리그 없이, 메이플처럼
// 당분간"): everyone, ranked by lifetime XP — the axis the tree grows on, so
// the tallest tree on the podium really is the top gardener. No beds, no
// promotion zones, no rules. What's left:
//   · a head line: title, gardeners, and the Sunday coin countdown
//   · the podium garden, top three by XP
//   · the list, every row with a sunlight bar (leader = full) and this
//     week's XP as the movement
//   · one pinned you-bar: place · the smallest thing that changes it · Learn
// Sunday coins still come from the weekly league functions, on this week's
// XP — a lifetime board would hand the same people the coins every week.
export default function RankingBoard({ species }: { species: CefrLevel }) {
  const t = useTranslations("ranking");
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [peek, setPeek] = useState<Row | null>(null);
  const [peekRings, setPeekRings] = useState<{ weeks: WeekRing[]; today: number } | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const meRef = useRef<HTMLDivElement>(null);
  // Opening a tree clears the last one's rings so they never show under
  // the wrong name while the new read is in flight.
  const openPeek = (r: Row | null) => {
    setPeekRings(null);
    setPeek(r);
  };

  // Once the board is in, bring the learner's own row on screen if it sits
  // below the fold. One-shot and instant.
  useEffect(() => {
    if (!rows || !meRef.current) return;
    const el = meRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= window.innerHeight - 90) return;
    el.scrollIntoView({ block: "center", behavior: "auto" });
  }, [rows]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Settle any elapsed weeks first so the Sunday coins are current.
      const settle = await supabase.rpc("settle_league_weeks");
      if (cancelled) return;
      if (settle.error) {
        setUnavailable(true);
        return;
      }
      const [board, auth] = await Promise.all([supabase.rpc("get_xp_ranking"), supabase.auth.getUser()]);
      if (cancelled) return;
      if (board.error) {
        setUnavailable(true);
        return;
      }
      setRows((board.data ?? []) as Row[]);

      // Accounts younger than the week have no "last week" to collect.
      const createdAt = auth.data.user?.created_at;
      let justJoined = false;
      if (createdAt) {
        const monday = new Date();
        monday.setUTCHours(0, 0, 0, 0);
        monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
        justJoined = new Date(createdAt) >= monday;
      }
      // claim_weekly_reward() is idempotent: first call for a week pays out,
      // every later call reports already_claimed and pays nothing twice.
      if (!justJoined) {
        const { data, error } = await supabase.rpc("claim_weekly_reward");
        if (cancelled) return;
        if (!error) {
          const r = Array.isArray(data) ? data[0] : data;
          setReward(r as Reward);
          if (r && !r.already_claimed && r.coins > 0) {
            setShowRewardPopup(true);
            playPromote();
          }
        } else {
          console.error("claim_weekly_reward failed:", error.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // The popup's rings: one small read per open, so the list itself stays
  // one call. Rings arrive after the popup — the tree shows at once.
  useEffect(() => {
    if (!peek) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.rpc("get_gardener_rings", { p_user_id: peek.user_id });
      if (cancelled || error) return;
      const days = (data ?? []) as RingDay[];
      const now = new Date();
      const weeks = buildWeeks(now, {
        attended: new Set(days.filter((d) => d.attended).map((d) => d.day)),
        studied: new Set(days.filter((d) => d.studied).map((d) => d.day)),
        reviewed: new Set(days.filter((d) => d.reviewed).map((d) => d.day)),
        xpByDay: xpByDayFrom(days.map((d) => ({ points: d.xp, created_at: `${d.day}T12:00:00` }))),
      });
      setPeekRings({ weeks, today: (now.getDay() + 6) % 7 });
    })();
    return () => {
      cancelled = true;
    };
  }, [peek, supabase]);

  if (unavailable) {
    return (
      <div className="border border-amber-line bg-[var(--tint-amber)] rounded-[14px] px-5 py-4 text-[13.5px] max-w-[560px]">
        {t("unavailable")}
      </div>
    );
  }

  const total = rows?.[0]?.total_players ?? 0;
  const podium = (rows ?? []).filter((r) => r.xp > 0).slice(0, 3);
  const leaderXp = rows?.[0]?.xp ?? 0;
  const meRow = rows?.find((r) => r.is_me) ?? null;
  const meIdx = rows?.findIndex((r) => r.is_me) ?? -1;
  const above = meIdx > 0 && rows ? rows[meIdx - 1] : null;
  const below = meIdx >= 0 && rows && meIdx + 1 < rows.length ? rows[meIdx + 1] : null;
  const gapUp = above && meRow ? Math.max(1, above.xp - meRow.xp + 1) : null;
  const gapDown = below && meRow ? Math.max(0, meRow.xp - below.xp) : null;
  const daysLeft = daysUntilWeekEnd();
  const placed = !!meRow && meRow.xp > 0;

  // The nudge: the smallest thing that changes your place.
  let nudge: string;
  if (!placed) nudge = t("nudge.noXp");
  // Lifetime gaps run into the thousands; the session estimate is only
  // honest when it is really one or a few sessions away.
  else if (above && gapUp !== null)
    nudge = `${t("nudge.pass", { n: gapUp, name: above.display_name })}${
      gapUp <= SESSION_XP ? ` ${t("nudge.oneSession")}` : gapUp <= SESSION_XP * 4 ? ` ${t("nudge.fewSessions")}` : ""
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
          rings={peekRings ?? undefined}
          onClose={() => openPeek(null)}
        />
      )}

      {/* head: title · gardeners · Sunday coins countdown */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-[22px] tracking-[-0.02em] leading-none">{t("title")}</h1>
          <p className="text-[12.5px] font-semibold text-faint mt-1.5">
            {t("head.byXp")}
            {total > 0 && <> · {t("head.gardeners", { n: total })}</>}
          </p>
        </div>
        <p className="flex-none text-right text-[11.5px] font-bold text-muted leading-tight tabular-nums">
          <span className="block text-[13px] text-[#B7791F]">{t("head.daysLeft", { n: daysLeft })}</span>
          {t("head.sundayCoins")}
        </p>
      </div>

      {/* the podium is a garden: the top three trees stand on the hills —
          1st centre and tallest, 2nd left, 3rd right — medal on the canopy,
          name · XP pill at the feet. */}
      {/* 2026-09-11 (user: "top 3 배경카드 … 너무 못생겼어"): the three trees
          used to float at three different heights by absolute %, their name
          pills ran into each other ("Re…" clipped under Ronnie's), your own
          tree got a yellow square frame, and the sun sat behind the gold
          medal. Now three equal columns on one ground line — 2nd, 1st, 3rd
          — size alone says the order, every pill sits on the same baseline
          inside its own column, no frame (your pill is the marker), and no
          sun or clouds competing with the medals. */}
      {/* 54vw reaches the 232px max right at 430px (62vw never reached its
          old 290px max on any phone, and left half the card as empty sky). */}
      {/* 2026-09-12: a little taller so the tallest looks (spirit tree) keep
          their canopy inside the card instead of touching the top edge. */}
      <GardenScene clouds={false} className="rounded-[18px] border border-line h-[clamp(216px,58vw,252px)]" hillsHeight="44%">
        {rows !== null && podium.length === 0 && (
          <div className="absolute left-3 right-3 top-3 flex items-center gap-2.5 border border-amber-line bg-[var(--tint-amber)]/95 rounded-[12px] px-4 py-2.5 text-[12.5px] font-semibold text-[var(--c-amber-deep)] z-[4]">
            🌱 {t("fair.empty")}
          </div>
        )}
        {podium.length > 0 && (
          <div className="absolute inset-x-2 bottom-3 z-[3] grid grid-cols-3 items-end gap-1">
            {[1, 0, 2].map((place) => {
              const r = podium[place];
              if (!r) return <div key={`empty-${place}`} />;
              const size =
                place === 0 ? "clamp(104px, 30vw, 132px)" : place === 1 ? "clamp(82px, 23vw, 104px)" : "clamp(74px, 21vw, 94px)";
              return (
                <div key={r.rank} className="min-w-0 flex flex-col items-center">
                  <div className="relative">
                    <span className="absolute -top-1 -right-1 z-10 leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,.2)]" aria-label={`#${r.rank}`}>
                      <Medal place={place as 0 | 1 | 2} rank={r.rank} />
                    </span>
                    <Tree row={r} species={species} size={size} bare onOpen={openPeek} />
                  </div>
                  {/* name over score, so a 360px column shows the whole name */}
                  <span
                    className={`mt-1 max-w-full flex flex-col items-center rounded-[10px] border px-2.5 py-1 text-center leading-tight ${
                      r.is_me ? "border-[#ECD98A]" : "border-[#E3DDD0]"
                    }`}
                    style={{ background: r.is_me ? "#FEF9C3" : "#FFFDF6", color: "#4A4237" }}
                  >
                    <span className="block max-w-full truncate text-[11.5px] font-bold">{r.display_name}</span>
                    <span className="block text-[10.5px] font-bold tabular-nums" style={{ color: "#6B6560" }}>
                      {t("fair.xp", { n: r.xp })}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </GardenScene>

      {/* the board: every row, a sunlight bar against the leader, this
          week's XP as the movement */}
      <div className="grid gap-1.5">
        {rows === null ? (
          <p className="px-2 py-5 text-[13.5px] text-faint">{t("zone.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="px-2 py-5 text-[13.5px] text-faint">{t("zone.empty")}</p>
        ) : (
          // the top three already stand on the podium — the rows start at
          // 4th (2026-09-12, user: "4,5등부터 행으로")
          rows.filter((r) => !podium.includes(r)).map((r, i, board) => {
            const gap = i > 0 && r.rank - board[i - 1].rank > 1;
            const pct = leaderXp > 0 ? Math.max(r.xp > 0 ? 3 : 0, Math.round((r.xp / leaderXp) * 100)) : 0;
            const top = r.rank <= 3 && r.xp > 0;
            return (
              <div key={r.user_id} className="grid gap-1.5">
                {gap && (
                  <div className="py-0.5 text-center text-[13px] tracking-[0.3em] text-faint" aria-hidden="true">
                    ⋯
                  </div>
                )}
                <div
                  ref={r.is_me ? meRef : undefined}
                  className={`grid grid-cols-[22px_48px_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-2 rounded-[12px] border text-[13.5px] scroll-mt-24 ${
                    r.is_me
                      ? "bg-[#FEF9C3] border-[#ECD98A] -rotate-[0.4deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)] text-[#2A2622]"
                      : "bg-cream border-line"
                  }`}
                >
                  <span className={`font-black tabular-nums text-[12.5px] text-center ${top ? "text-[#B7791F]" : r.is_me ? "" : "text-faint"}`}>
                    {r.rank}
                  </span>
                  <Tree row={r} species={species} size={48} onOpen={openPeek} />
                  <span className="min-w-0">
                    <b className="block truncate leading-tight">
                      {r.display_name}
                      {r.is_me && <span className="text-success text-[11.5px] font-bold ml-1.5">{t("row.you")}</span>}
                    </b>
                    <span className="mt-1.5 block h-[7px] rounded-full overflow-hidden" style={{ background: "var(--c-warm-2)" }} aria-hidden="true">
                      <i
                        className="not-italic block h-full rounded-full"
                        style={{ width: `${pct}%`, background: "linear-gradient(90deg,#F2C94C,#F7DC85)", boxShadow: "inset 0 -1px 0 #B7861A" }}
                      />
                    </span>
                  </span>
                  <span className="text-right">
                    <b className="block tabular-nums text-[13px] text-success-deep leading-tight">{t("fair.xp", { n: r.xp })}</b>
                    <small className="block text-[11px] text-faint font-semibold tabular-nums">
                      {t("row.level", { n: r.level })}
                      {r.xp_week > 0 && <> · {t("row.thisWeek", { n: r.xp_week })}</>}
                    </small>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* the you-bar — place · nudge · Learn, pinned above the phone's bottom nav */}
      {rows !== null && (
        <div className="sticky bottom-[72px] md:bottom-3 z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 bg-[#FEF9C3] border border-[#ECD98A] rounded-[12px] px-3.5 py-2.5 text-[12.5px] shadow-[0_10px_24px_-16px_rgba(50,40,20,.5)]">
          {placed && meRow ? (
            <b className="tabular-nums text-[13px] text-[#2A2622] leading-tight">
              {t("bar.place", { rank: meRow.rank, total })}
              {above && gapUp !== null && (
                <small className="block text-[10.5px] font-bold text-muted">{t("bar.toNext", { n: gapUp, rank: above.rank })}</small>
              )}
            </b>
          ) : (
            <span aria-hidden="true">🌱</span>
          )}
          <span className="min-w-0 font-semibold text-muted leading-snug">{nudge}</span>
          <Link
            href="/vocabulary"
            className="rounded-[9px] bg-success px-3 py-1.5 text-[12.5px] font-bold text-white shadow-[0_3px_0_#2E5B41] hover:translate-y-px hover:shadow-[0_2px_0_#2E5B41] transition-all whitespace-nowrap"
          >
            {t("nudge.learn")}
          </Link>
        </div>
      )}

      {/* One-time popup: last week's board just paid out, right now. */}
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
