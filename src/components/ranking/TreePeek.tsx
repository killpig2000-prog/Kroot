"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import LevelCreature from "@/components/dashboard/LevelCreature";
import VeteranTree, { BASE_HEIGHT, VETERAN_MILESTONES, veteranFrameHeight } from "@/components/dashboard/VeteranTree";
import { FULLY_GROWN_LEVEL, treeHeightMetres, treeStageForLevel } from "@/lib/level";
import { SceneLayer, skyFor } from "@/lib/costumes";
import type { CefrLevel } from "@/lib/tree";

// Same five steps as the dashboard's MonthlyGrass.
const GRASS = ["bg-[#F0EFED]", "bg-[#BBF7D0]", "bg-[#6BBF8A]", "bg-[#3E7C59]", "bg-[#2E5B41]"];
function grassLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 20) return 2;
  if (minutes < 40) return 3;
  return 4;
}
const GARDEN_WEEKS = 5;
function buildGarden(minutesByDate: Map<string, number>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // End the grid on this week's Sunday so today is on the last row.
  const end = new Date(today);
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
  const start = new Date(end);
  start.setDate(start.getDate() - GARDEN_WEEKS * 7 + 1);
  const cells: { date: string; minutes: number; lvl: number; future: boolean; today: boolean }[] = [];
  let studied = 0;
  let past = 0;
  for (let i = 0; i < GARDEN_WEEKS * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const minutes = minutesByDate.get(iso) ?? 0;
    const future = d > today;
    if (!future) {
      past++;
      if (minutes > 0) studied++;
    }
    cells.push({ date: iso, minutes, lvl: grassLevel(minutes), future, today: d.getTime() === today.getTime() });
  }
  return { cells, studied, past };
}

// Tapping a tree on the ranking opens the whole thing: a Lv.50+ tree grows
// past any thumbnail, so the row shows the crown and this shows the tree.
// The frame is fixed and the SVG scales to fit — a taller tree draws smaller,
// which is what makes "look how tall theirs is" readable at a glance. Kept
// to about a third of the phone's height: at two thirds it read as a whole
// screen, not a card.
export default function TreePeek({
  userId,
  name,
  rank,
  avatarUrl,
  level,
  xpWeek,
  species,
  costumeIds,
  isMe,
  onClose,
}: {
  userId: string;
  name: string;
  rank: number;
  avatarUrl: string | null;
  level: number;
  xpWeek: number;
  species: CefrLevel;
  costumeIds: string[];
  isMe: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("ranking");
  const tk = useTranslations("dashboard.tree.keepsakes");
  const veteran = level >= FULLY_GROWN_LEVEL;
  const frameH = veteran ? veteranFrameHeight(level) : BASE_HEIGHT;
  const sky = skyFor(costumeIds);
  const earned = VETERAN_MILESTONES.filter((m) => m.level <= level);

  // The person's study garden for the last five weeks — the same cells and
  // colours as the dashboard's, read through get_public_activity (migration
  // 0076): dates and minutes only, nothing about what was studied.
  const supabase = useMemo(() => createClient(), []);
  const [activity, setActivity] = useState<Map<string, number> | null>(null);
  useEffect(() => {
    let cancelled = false;
    void supabase.rpc("get_public_activity", { p_user: userId }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("get_public_activity failed:", error.message);
        setActivity(new Map());
        return;
      }
      setActivity(new Map((data ?? []).map((r: { activity_date: string; minutes: number | null }) => [r.activity_date, r.minutes ?? 0])));
    });
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);
  const garden = useMemo(() => buildGarden(activity ?? new Map()), [activity]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <button aria-label={t("peek.close")} onClick={onClose} className="fixed inset-0 z-[60] bg-[#282319]/50 cursor-default" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          className="pointer-events-auto w-full max-w-[300px] bg-cream rounded-[20px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.4)] overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
            <div className="min-w-0 flex items-center gap-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full border border-line object-cover flex-none" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-success-bg border border-success-line grid place-items-center text-[15px] font-black text-success-deep flex-none">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
              <b className="block text-[16px] truncate">
                <span className="inline-grid place-items-center min-w-[24px] h-[22px] px-1.5 mr-1.5 rounded-full bg-[#FFFBEB] border border-amber-line text-[11.5px] font-black text-[#B7791F] tabular-nums align-[-3px]">
                  #{rank}
                </span>
                {name}
                {isMe && <span className="text-success text-[11.5px] font-bold ml-1.5">{t("row.you")}</span>}
              </b>
              <span className="text-[12.5px] text-muted tabular-nums">
                {t("row.level", { n: level })} · {t("fair.sun", { n: xpWeek })}
                {veteran && <> · {t("peek.height", { m: treeHeightMetres(level) })}</>}
              </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("peek.close")}
              className="flex-none w-8 h-8 rounded-full bg-warm text-muted hover:text-charcoal text-[15px] leading-none"
            >
              ✕
            </button>
          </div>

          {/* fixed-height stage; the SVG keeps its aspect and fits inside */}
          <div
            className="mx-5 rounded-[16px] border border-success-line flex items-end justify-center overflow-hidden"
            style={{ height: "min(36vh, 300px)", background: sky ?? "linear-gradient(180deg, #EAF6FF 0%, #EAF3EC 70%)" }}
          >
            <svg viewBox={`0 0 220 ${frameH}`} className="h-full w-auto max-w-full" aria-hidden="true">
              <SceneLayer costumeIds={costumeIds} layer="behind" />
              {veteran ? (
                <VeteranTree level={level} species={species} costumeIds={costumeIds} />
              ) : (
                <LevelCreature level={treeStageForLevel(level)} costumeIds={costumeIds} species={species} />
              )}
              <SceneLayer costumeIds={costumeIds} layer="front" />
            </svg>
          </div>

          <div className="px-5 pt-3 pb-4 grid gap-3">
            {earned.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {earned.map((m) => (
                  <span
                    key={m.level}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-line bg-[var(--tint-amber)] px-2.5 py-1 text-[11.5px] font-bold text-[#B7791F]"
                  >
                    <span className="kr">{m.kr}</span>
                    <span className="opacity-70">{tk(String(m.level))}</span>
                  </span>
                ))}
              </div>
            )}

            {/* study garden: 5 rows of 7, Monday first, today at the end */}
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-extrabold tracking-[.08em] uppercase text-faint">{t("peek.garden")}</span>
                <span className="text-[12px] font-semibold text-muted tabular-nums">
                  {activity ? t("peek.daysStudied", { n: garden.studied, total: garden.past }) : "…"}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-[3px]" aria-hidden="true">
                {garden.cells.map((c) => (
                  <span
                    key={c.date}
                    title={`${c.date} · ${c.minutes}m`}
                    className={`h-[14px] rounded-[3px] ${c.future ? "bg-transparent border border-dashed border-line" : GRASS[c.lvl]} ${c.today ? "ring-1 ring-[#2E5B41]" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
