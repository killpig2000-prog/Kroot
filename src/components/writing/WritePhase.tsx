"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { WRITING_GENRE_META, type Prompt } from "@/lib/writing";
import { getLocalizedExample, getLocalizedPrompt, getLocalizedStimulus } from "@/lib/writing-i18n";
import { checkTiles, type Board } from "@/lib/writing-builder";
import { TileBoard } from "@/components/writing/WritingBoards";

const CARD = "border border-line rounded-[16px] bg-cream max-w-[900px] overflow-hidden";
const BTN_INK =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";
const BTN_LINE =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-charcoal bg-cream border border-line hover:bg-warm transition-colors disabled:opacity-40";
const EYEBROW = "text-[11px] font-extrabold tracking-[.1em] uppercase text-success mb-1.5";

/** Per-question interaction state, owned by WritingSession. Each question is
 * checked here as it's answered (see WritePhase's own `checked` state for
 * the per-question right/wrong), so there is nothing to record but the picks —
 * `WritingSession.submit` re-derives the final scored answers from these. */
export type Entry = {
  /** Reseed counter — bumps on "shuffle" so a fresh attempt gets a fresh board. */
  attempt: number;
  picked: string[];
};

export function emptyEntry(): Entry {
  return { attempt: 0, picked: [] };
}

/** Every slot filled — not whether it's right, only whether there's an answer to check. */
export function entryDone(entry: Entry, board: Board): boolean {
  return entry.picked.length === board.answer.length;
}

export default function WritePhase({
  prompts,
  chapterIndex,
  entries,
  boards,
  update,
  onReset,
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
  onReset: (index: number) => void;
  submitting: boolean;
  ready: boolean;
  answeredCount: number;
  onSubmit: () => void;
}) {
  const t = useTranslations("writing");
  const locale = useLocale();
  const genre = prompts[0].genre;
  const genreMeta = WRITING_GENRE_META[genre];

  // One question on screen at a time — with N tile boards stacked, the page
  // was a wall of buttons (a Check per board, a shuffle per board, tiles on
  // tiles) and finding "the one for this question" took real hunting.
  const [step, setStep] = useState(0);
  const last = prompts.length - 1;
  const prompt = prompts[step];
  const entry = entries[step];
  const board = boards[step];

  // Checked per question now, not once at the end of the chapter: tap
  // Check, see the correct sentence right away, then move on. `checked[i]`
  // is absent until that question has been checked once.
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const stepChecked = checked[step];
  const isChecked = step in checked;

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

      {/* one question */}
      <div key={prompt.key} className="px-5 sm:px-[clamp(20px,3vw,32px)] py-[22px]">
        <div className="flex items-center gap-2 mb-3">
          {prompts.map((p, i) => (
            <button
              key={p.key}
              type="button"
              aria-label={t("phase.qOf", { n: i + 1, total: prompts.length })}
              aria-current={i === step}
              onClick={() => setStep(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === step ? "bg-amber" : entryDone(entries[i], boards[i]) ? "bg-success" : "bg-line"
              }`}
            />
          ))}
          <span className="text-[11px] font-semibold text-faint tracking-[.05em] uppercase ml-1">
            {t("phase.qOf", { n: step + 1, total: prompts.length })}
          </span>
        </div>

        {prompt.stimulus_kr && (
          <div className="mb-3 flex gap-2 items-start">
            <span className="flex-none w-7 h-7 rounded-full bg-[var(--tint-sky)] border border-sky-line flex items-center justify-center text-[13px]">
              💬
            </span>
            <div className="rounded-[12px] rounded-tl-[4px] bg-warm border border-line px-3.5 py-2.5 max-w-[92%]">
              <p className="kr text-[13.5px] leading-[1.65] text-charcoal">{prompt.stimulus_kr}</p>
              {prompt.stimulus_en && (
                <p className="text-[11.5px] text-muted leading-[1.5] mt-1">{getLocalizedStimulus(prompt, locale)}</p>
              )}
            </div>
          </div>
        )}

        <div className="mb-3">
          <p className="kr font-bold text-[16px] leading-[1.4]">{prompt.prompt_kr}</p>
          <p className="text-[13px] text-muted">{getLocalizedPrompt(prompt, locale)}</p>
        </div>

        <div data-tour="guided-writing-board">
        <div className="mb-3">
          <div className={EYEBROW}>{t("phase.modeTiles")}</div>
          <p className="text-[19px] font-extrabold leading-[1.3] tracking-[-0.01em]" style={{ textWrap: "balance" }}>
            {getLocalizedExample(prompt, locale)}
          </p>
        </div>

        <TileBoard
          board={board}
          picked={entry.picked}
          onChange={(picked) => {
            if (isChecked) return; // locked once checked — Reset (or Next/Back) starts a fresh attempt
            update(step, { picked });
          }}
          onReset={() => {
            onReset(step);
            setChecked((prev) => {
              const next = { ...prev };
              delete next[step];
              return next;
            });
          }}
        />
        </div>

        {!isChecked ? (
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              data-tour="guided-writing-check"
              className={BTN_INK}
              onClick={() => setChecked((prev) => ({ ...prev, [step]: checkTiles(board, entry.picked) }))}
              disabled={!entryDone(entry, board)}
            >
              {t("board.check")}
            </button>
          </div>
        ) : (
          <div
            data-tour="guided-writing-result"
            className={`rounded-[12px] border px-3.5 py-3 ${
              stepChecked ? "bg-success-bg border-success-line text-success-deep" : "bg-[var(--tint-amber)] border-amber-line text-amber"
            }`}
          >
            <div className="text-[11px] font-extrabold tracking-[.08em] uppercase mb-1 opacity-80">
              {stepChecked ? t("board.correct") : t("phase.correctSentence")}
            </div>
            <p className="kr text-[15px] leading-[1.6]">{board.answer.join(" ")}</p>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-[clamp(20px,3vw,32px)] py-[18px] border-t border-line bg-cream flex-wrap">
        <div className="flex items-center gap-3">
          <button type="button" className={BTN_LINE} onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            {t("phase.back")}
          </button>
          <span className="text-[13px] text-muted">{t("phase.doneCount", { done: answeredCount, total: prompts.length })}</span>
        </div>
        {step < last ? (
          <button type="button" className={BTN_INK} onClick={() => setStep((s) => s + 1)} disabled={!isChecked}>
            {t("phase.nextQuestion")}
          </button>
        ) : (
          <button type="button" className={BTN_INK} onClick={onSubmit} disabled={submitting || !ready || !isChecked}>
            {submitting ? t("phase.saving") : t("phase.finishChapter")}
          </button>
        )}
      </div>
    </div>
  );
}
