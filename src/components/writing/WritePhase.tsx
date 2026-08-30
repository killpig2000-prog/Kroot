"use client";

import { useTranslations } from "next-intl";
import { WRITING_GENRE_META, type Prompt } from "@/lib/writing";
import type { Board } from "@/lib/writing-builder";
import { TileBoard } from "@/components/writing/WritingBoards";

const CARD = "border border-line rounded-[16px] bg-cream max-w-[900px] overflow-hidden";
const BTN_INK =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";
const EYEBROW = "text-[11px] font-extrabold tracking-[.1em] uppercase text-success mb-1.5";

/** Per-question interaction state, owned by WritingSession. */
export type Entry = {
  /** Reseed counter — bumps on "shuffle" so a retry gets a fresh board. */
  attempt: number;
  picked: string[];
  checked: boolean | null;
  /** How many times Check was pressed. */
  checks: number;
};

export function emptyEntry(): Entry {
  return { attempt: 0, picked: [], checked: null, checks: 0 };
}

export function entryDone(entry: Entry): boolean {
  return entry.checked === true;
}

export default function WritePhase({
  prompts,
  chapterIndex,
  entries,
  boards,
  update,
  onCheck,
  onShuffle,
  submitting,
  ready,
  answeredCount,
  onSubmit,
}: {
  prompts: Prompt[];
  chapterIndex: number;
  entries: Entry[];
  boards: Board[];
  update: (index: number, patch: Partial<Entry>) => void;
  onCheck: (index: number) => void;
  onShuffle: (index: number) => void;
  submitting: boolean;
  ready: boolean;
  answeredCount: number;
  onSubmit: () => void;
}) {
  const t = useTranslations("writing");
  const genre = prompts[0].genre;
  const genreMeta = WRITING_GENRE_META[genre];

  return (
    <div className={CARD}>
      {/* head */}
      <div className="p-[clamp(20px,3vw,32px)] pb-5 border-b border-dashed border-line bg-cream grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber bg-[var(--tint-amber)] border border-amber-line px-2.5 py-1 rounded-full mb-2.5">
            {genreMeta.icon} {t(`genres.${genre}.label`)}
          </span>
          <h1 className="font-extrabold text-[22px] sm:text-[24px] tracking-[-0.02em]" style={{ textWrap: "balance" }}>
            {t("session.chapterN", { n: chapterIndex + 1 })}
          </h1>
          <p className="text-[13.5px] text-muted mt-1">{t("phase.answersHint", { n: prompts.length })}</p>
        </div>
        <div className="max-w-[260px] text-[12.5px] leading-[1.55] text-success bg-success-bg border border-success-line rounded-[12px] px-3 py-2.5">
          <b className="block text-[13px] text-success-deep mb-0.5">{t("phase.holdTipTitle")}</b>
          {t("phase.holdTipBody")}
        </div>
      </div>

      {/* questions */}
      <div className="flex flex-col">
        {prompts.map((prompt, i) => {
          const entry = entries[i];
          const board = boards[i];
          return (
            <div
              key={prompt.key}
              className={`grid grid-cols-1 sm:grid-cols-[56px_1fr] gap-x-4 px-5 sm:px-[clamp(20px,3vw,32px)] py-[22px] ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <div className="text-[13px] font-extrabold text-amber tracking-[.02em] pt-[3px] mb-2 sm:mb-0">
                Q{i + 1}
                <small className="block text-[10.5px] text-faint font-semibold tracking-[.08em] mt-0.5">
                  {t("phase.qOf", { n: prompts.length })}
                </small>
              </div>
              <div>
                {prompt.stimulus_kr && (
                  <div className="mb-3 flex gap-2 items-start">
                    <span className="flex-none w-7 h-7 rounded-full bg-[var(--tint-sky)] border border-sky-line flex items-center justify-center text-[13px]">
                      💬
                    </span>
                    <div className="rounded-[12px] rounded-tl-[4px] bg-warm border border-line px-3.5 py-2.5 max-w-[92%]">
                      <p className="kr text-[13.5px] leading-[1.65] text-charcoal">{prompt.stimulus_kr}</p>
                      {prompt.stimulus_en && <p className="text-[11.5px] text-muted leading-[1.5] mt-1">{prompt.stimulus_en}</p>}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <p className="kr font-bold text-[16px] leading-[1.4]">{prompt.prompt_kr}</p>
                  <p className="text-[13px] text-muted">{prompt.prompt_en}</p>
                </div>

                <div className="mb-3">
                  <div className={EYEBROW}>{t("phase.modeTiles")}</div>
                  <p className="text-[19px] font-extrabold leading-[1.3] tracking-[-0.01em]" style={{ textWrap: "balance" }}>
                    {prompt.example_en}
                  </p>
                </div>

                <TileBoard
                  board={board}
                  picked={entry.picked}
                  checked={entry.checked}
                  onChange={(picked) => update(i, { picked, checked: null })}
                  onCheck={() => onCheck(i)}
                  onShuffle={() => onShuffle(i)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-[clamp(20px,3vw,32px)] py-[18px] border-t border-line bg-cream flex-wrap">
        <div className="flex items-center gap-2.5 text-[13px] text-muted">
          <span className="flex gap-1.5">
            {prompts.map((p, i) => (
              <i key={p.key} className={`w-2.5 h-2.5 rounded-full ${entryDone(entries[i]) ? "bg-success" : "bg-line"}`} />
            ))}
          </span>
          {t("phase.doneCount", { done: answeredCount, total: prompts.length })}
        </div>
        <button className={BTN_INK} onClick={onSubmit} disabled={submitting || !ready}>
          {submitting ? t("phase.saving") : t("phase.finishChapter")}
        </button>
      </div>
    </div>
  );
}
