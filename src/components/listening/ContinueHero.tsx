"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import Waveform from "@/components/listening/Waveform";
import { estMinutes, loadHeard, loadLastListened } from "@/lib/listening-resume";
import { getLocalizedDialogueTitle } from "@/lib/listening-i18n";
import type { LocalizedString } from "@/lib/listening-dialogues";
import type { CefrLevel } from "@/lib/tree";

const BTN_TEAL = buttonClassName("teal");

export type HeroClip = {
  id: string;
  title: LocalizedString | string;
  situationKey: string;
  situationLabel: string;
  situationIcon: string;
  /** 1-based position inside its situation at this level. */
  clipNo: number;
  clipCount: number;
  lineCount: number;
};

// Listening home hero: the clip to go back to (last one left mid-way, else
// the next unheard one), plus a small stats strip — minutes this week and
// clips heard at this level. Resume positions live in localStorage, so the
// pick happens after mount; the server renders the "next unheard" fallback.
export default function ContinueHero({
  level,
  clips,
  completedIds,
  weekMinutes,
  todayIndex,
  heardAtLevel,
}: {
  level: CefrLevel;
  clips: HeroClip[];
  completedIds: string[];
  /** Minutes studied Mon→Sun of the current week. */
  weekMinutes: number[];
  /** 0 = Monday … 6 = Sunday. */
  todayIndex: number;
  heardAtLevel: number;
}) {
  const t = useTranslations("listening.home");
  const locale = useLocale();
  const completed = new Set(completedIds);
  const fallback = clips.find((c) => !completed.has(c.id)) ?? null;
  const [pick, setPick] = useState<{ clip: HeroClip; heard: number } | null>(
    fallback ? { clip: fallback, heard: 0 } : null
  );

  useEffect(() => {
    const t = setTimeout(() => {
      const last = loadLastListened();
      const byLast = last ? clips.find((c) => c.id === last && !completed.has(c.id)) : null;
      const candidates = byLast ? [byLast, ...clips] : clips;
      for (const c of candidates) {
        if (completed.has(c.id)) continue;
        const h = loadHeard(c.id, c.lineCount);
        if (h > 0 && h < c.lineCount) {
          setPick({ clip: c, heard: h });
          return;
        }
      }
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips, completedIds]);

  const total = weekMinutes.reduce((a, b) => a + b, 0);
  const peak = Math.max(1, ...weekMinutes);
  const DAYS = t("days").split(" ");

  const resuming = !!pick && pick.heard > 0;
  const c = pick?.clip;
  const left = c ? estMinutes(c.lineCount - (pick?.heard ?? 0)) : 0;

  return (
    <div className="grid md:grid-cols-[minmax(0,1fr)_260px] border border-line rounded-[16px] bg-cream overflow-hidden mb-4 max-w-[980px]">
      <div className="px-[clamp(18px,3vw,26px)] py-5 md:py-6 flex flex-col gap-3.5 min-w-0">
        <span className="inline-flex items-center gap-2 text-[11.5px] font-extrabold tracking-[.1em] uppercase text-teal">
          {resuming ? (
            <span aria-hidden="true" className="inline-flex items-end gap-[2px] h-3">
              {[0, 0.15, 0.3, 0.45].map((d) => (
                <i key={d} className="eq-bar w-[3px] rounded-[2px] bg-teal" style={{ animationDelay: `${d}s` }} />
              ))}
            </span>
          ) : (
            <span aria-hidden="true">▶</span>
          )}
          {resuming ? t("continueTag") : t("upNextTag")}
        </span>

        {c ? (
          <>
            <div>
              <h2 className="font-extrabold text-[clamp(19px,2.4vw,24px)] tracking-[-0.02em] leading-tight [text-wrap:balance]">
                {getLocalizedDialogueTitle(c.title, locale)}
              </h2>
              <p className="text-[13.5px] text-muted mt-0.5">
                {t("clipOf", { icon: c.situationIcon, situation: c.situationLabel, n: c.clipNo, total: c.clipCount, level })}
                {resuming && t("stoppedAt", { heard: pick!.heard, total: c.lineCount })}
              </p>
            </div>
            <Waveform seed={c.id} lineCount={c.lineCount} heard={pick?.heard ?? 0} barsPerLine={5} height={36} />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-3 text-[12.5px] text-muted tabular-nums">
                <span>{t("linesOf", { heard: pick?.heard ?? 0, total: c.lineCount })}</span>
                <span>{resuming ? t("minLeft", { min: left }) : t("minTotal", { min: left })}</span>
              </div>
              <Link href={`/listening/${c.situationKey}?level=${level}&clip=${c.id}`} className={BTN_TEAL}>
                {resuming ? t("resume") : t("start")}
              </Link>
            </div>
          </>
        ) : (
          <div>
            <h2 className="font-extrabold text-[22px] tracking-[-0.02em]">{t("allHeardTitle", { level })}</h2>
            <p className="text-[13.5px] text-muted mt-0.5">{t("allHeardSub")}</p>
          </div>
        )}
      </div>

      <div className="border-t md:border-t-0 md:border-l border-dashed border-dash bg-warm px-[22px] py-5 flex flex-col justify-center gap-3.5">
        <div className="flex items-baseline justify-between">
          <b className="text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">
            {total}
            <small className="text-[12px] text-muted font-semibold ml-[3px]">{t("minUnit")}</small>
          </b>
          <span className="text-[12px] text-muted">{t("thisWeek")}</span>
        </div>
        <div>
          <div aria-hidden="true" className="flex items-end gap-[5px] h-[34px]">
            {weekMinutes.map((m, i) => (
              <i
                key={i}
                className={`flex-1 rounded-t-[4px] rounded-b-[2px] ${
                  m > 0 ? "bg-teal" : "bg-[var(--tint-teal-line)]"
                } ${i === todayIndex ? "outline outline-2 outline-offset-1 outline-[var(--tint-teal-line)]" : ""}`}
                style={{ height: `${Math.max(12, Math.round((m / peak) * 100))}%` }}
              />
            ))}
          </div>
          <div className="flex gap-[5px] text-[10px] text-faint text-center mt-1">
            {DAYS.map((d, i) => (
              <span key={i} className={`flex-1 ${i === todayIndex ? "text-teal font-bold" : ""}`}>
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <b className="text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">
            {heardAtLevel}
            <small className="text-[12px] text-muted font-semibold ml-[3px]">{t("clipsUnit")}</small>
          </b>
          <span className="text-[12px] text-muted">{t("heardAt", { level })}</span>
        </div>
      </div>
    </div>
  );
}
