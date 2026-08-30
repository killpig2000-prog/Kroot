import { useLocale, useTranslations } from "next-intl";
import ProgressRing from "@/components/listening/ProgressRing";
import { estMinutes } from "@/lib/listening-resume";
import { waveHeights, type Situation } from "@/lib/listening";
import { getLocalizedDialogueTitle } from "@/lib/listening-i18n";
import type { Dialogue } from "@/lib/listening-dialogues";
import type { CefrLevel } from "@/lib/tree";

// Situation page: hero (icon, name, big progress ring) and the clips as a
// playlist table — #, title + Korean key phrase, length, status pill. Every
// row always opens its clip at line 1 — clips don't resume mid-way.
export default function ClipList({
  dialogues,
  situation,
  level,
  completed,
  doneCount,
  newLevel,
  onOpenClip,
}: {
  dialogues: Dialogue[];
  situation: Situation;
  level: CefrLevel;
  completed: Set<string>;
  doneCount: number;
  newLevel: number | null;
  onOpenClip: (id: string) => void;
}) {
  const t = useTranslations("listening.situation");
  const locale = useLocale();
  const totalLines = dialogues.reduce((n, d) => n + d.lines.length, 0);

  return (
    <div className="max-w-[760px]">
      {newLevel && (
        <p className="text-[13px] font-semibold text-success mb-3">{t("levelUp", { level: newLevel })}</p>
      )}

      <div className="border border-line rounded-[16px] bg-cream overflow-hidden">
        {/* hero */}
        <div
          className="grid sm:grid-cols-[minmax(0,1fr)_auto] gap-4 items-center px-[clamp(16px,3vw,26px)] py-5 border-b border-line"
          style={{ background: `linear-gradient(90deg, ${situation.tint} 0%, var(--c-warm) 70%)` }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-[52px] h-[52px] rounded-[14px] bg-cream border border-line grid place-items-center text-[26px] shadow-sm flex-none">
              {situation.icon}
            </span>
            <div className="min-w-0">
              <h1 className="font-extrabold text-[22px] tracking-[-0.02em] leading-tight">
                {situation.label}
                <small className="kr text-[13px] text-muted font-semibold ml-2">
                  {situation.krLabel} · {level}
                </small>
              </h1>
              <p className="text-[13px] text-muted mt-0.5">
                {situation.sub && <>{situation.sub} · </>}
                {t("clipsMin", { n: dialogues.length, min: estMinutes(totalLines) })}
              </p>
            </div>
          </div>
          <ProgressRing value={doneCount} max={dialogues.length} size={76} stroke={7} trackClassName="stroke-line">
            <span className="text-center leading-none">
              <b className="block text-[14px] font-extrabold tabular-nums">
                {doneCount}/{dialogues.length}
              </b>
              <small className="block text-[9.5px] text-muted tracking-[.06em] mt-0.5">{t("heard")}</small>
            </span>
          </ProgressRing>
        </div>

        {/* list head */}
        <div className="hidden sm:grid grid-cols-[40px_1fr_120px_70px] gap-3 px-[18px] py-2.5 text-[10.5px] font-bold tracking-[.1em] uppercase text-faint border-b border-line bg-warm">
          <span>{t("headNum")}</span>
          <span>{t("headClip")}</span>
          <span>{t("headLength")}</span>
          <span className="text-right">{t("headStatus")}</span>
        </div>

        {dialogues.map((d, i) => {
          const done = completed.has(d.id);
          const bars = waveHeights(d.id, Math.min(8, d.lines.length));
          return (
            <button
              key={d.id}
              onClick={() => onOpenClip(d.id)}
              className={`w-full grid grid-cols-[34px_1fr_auto] sm:grid-cols-[40px_1fr_120px_70px] gap-3 items-center px-[18px] py-3 text-left transition-colors hover:bg-[var(--tint-teal)] ${
                i < dialogues.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full grid place-items-center text-[12px] font-extrabold tabular-nums border ${
                  done ? "bg-success-bg border-success-line text-success" : "bg-warm border-line text-faint"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="min-w-0">
                <b className={`block truncate text-[14px] ${done ? "font-medium text-muted" : "font-bold"}`}>
                  {getLocalizedDialogueTitle(d.title, locale)}
                </b>
                <small className="kr block truncate text-[12px] text-faint font-normal">{d.lines[0]?.kr}</small>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-muted tabular-nums">
                <span aria-hidden="true" className="inline-flex items-end gap-[2px] h-3">
                  {bars.map((h, j) => (
                    <i key={j} className="w-[3px] rounded-[1px] bg-dash" style={{ height: `${Math.round(h * 12)}px` }} />
                  ))}
                </span>
                {t("linesMin", { n: d.lines.length, min: estMinutes(d.lines.length) })}
              </span>
              <span
                className={`justify-self-end text-[11px] font-bold px-2.5 py-[3px] rounded-full tabular-nums ${
                  done ? "bg-success-bg text-success" : "bg-warm text-faint"
                }`}
              >
                {done ? t("pillHeard") : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
