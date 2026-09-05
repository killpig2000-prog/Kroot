"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import ResultShell, { ResultRing, ResultTag } from "@/components/results/ResultShell";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, XP_POINTS, type ProgressResult } from "@/lib/activity";
import { vocabChapterKey } from "@/lib/reward-keys";
import { nextBox, nextReviewAt } from "@/lib/srs";
import { MINUTES_PER_SESSION } from "@/lib/vocabulary";
import { saveToBank } from "@/lib/word-bank";
import { speakKorean, prefetchKorean } from "@/lib/tts";
import { getWordNote, hanjaOf } from "@/lib/word-notes";
import { getLocalizedMeaning, getLocalizedExampleEn } from "@/lib/vocabulary-i18n";

const BTN_INK = buttonClassName("ink");
const BTN_LINE = buttonClassName("line");
const VIOLET = "#6B33CC";

// Ruled notebook paper: a faint line every 32px, plus a red margin rule.
const RULED = "repeating-linear-gradient(180deg, transparent 0 31px, #EEF0F6 31px 32px)";

export type DetailWord = {
  key: string;
  korean: string;
  romanization: string;
  meaning_en: string;
  example_kr: string;
  example_en: string;
  moreExamples: { kr: string; en: string; source: "reading" | "listening" }[];
};

// A dictionary entry for a single word — the one way words are studied.
// "Got it" / "Still learning" record SRS progress, and marking the last
// unmarked word of a Day pays that Day out (see `payOutDay`).
export default function WordDetailCard({
  word,
  locale,
  userId,
  correctCount,
  incorrectCount,
  box,
  topicLabel,
  level,
  prevHref,
  nextHref,
  inBank: initialInBank,
  savedCount: initialSavedCount,
  slots,
  fromBank,
  backHref,
  backLabel,
  unitHref,
  unitLabel,
  topicKey,
  dayIndex,
  dayTotal,
  othersMarked,
  othersGotIt,
  hasNextDay,
}: {
  word: DetailWord;
  locale: string;
  userId: string;
  correctCount: number;
  incorrectCount: number;
  box: number;
  topicLabel: string;
  level: string;
  prevHref: string | null;
  nextHref: string | null;
  /** Whether this word is one of the learner's picked words. */
  inBank: boolean;
  /** How many words the bank holds right now, and how many it can hold. */
  savedCount: number;
  slots: number;
  /** Opened from /review/words — show the way back to it. */
  fromBank: boolean;
  /** Where the learner came from, when it wasn't a vocabulary unit (e.g. a
      reading passage). Overrides the unit link at the top of the card. */
  backHref?: string | null;
  backLabel?: string;
  unitHref: string;
  unitLabel: string;
  topicKey: string;
  /** Which Day (10-word unit) this word belongs to. */
  dayIndex: number;
  dayTotal: number;
  /** How many of the Day's *other* words are already marked either way, and
      how many of those were last answered "got it" (for the accuracy gate). */
  othersMarked: number;
  othersGotIt: number;
  hasNextDay: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("vocabulary");
  const tn = useTranslations("nav");
  const tu = useTranslations("ui");
  const tw = useTranslations("words");
  const [inBank, setInBank] = useState(initialInBank);
  const [savedCount, setSavedCount] = useState(initialSavedCount);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<"full" | "error" | null>(null);
  const note = getWordNote(word.korean);
  const hanja = hanjaOf(word.korean);
  // Which button is mid-save, so it can say so instead of just greying out.
  const [saving, setSaving] = useState<"next" | "got-it" | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  // Got it is a toggle now, separate from moving on — tap it to check the
  // word off, tap again to undo. Navigating to the next word is its own
  // button, so a learner can check off several words before moving on.
  //
  // Seeded from `box`, not the 3-bucket new/learning/known review-count
  // status: box only rises above 1 on a "got it" and resets to 1 the moment
  // a word is marked still-learning, so box > 1 means the last review was a
  // hit — exactly what the checkmark badge claims. The review-count status
  // needed 4+ reviews to reach "known", so a word gotten right once or
  // twice looked marked right after tapping (setMarked runs directly) but
  // reverted to unmarked on the next visit — the tap "didn't stick" from
  // the learner's point of view. There's no "new"/"learning" label shown
  // any more either way — just the checkmark, or nothing.
  const [marked, setMarked] = useState(box > 1);
  // Set when marking this word is what completed the Day — the card gives way
  // to the Day's result screen.
  const [dayResult, setDayResult] = useState<{ known: number; levelUp: ProgressResult | null } | null>(null);

  // This word counts as studied once it has been answered either way. Only
  // the *transition* into a full Day pays: a word already marked before this
  // visit can be re-answered as often as the learner likes without
  // re-triggering the payout.
  const alreadyStudied = correctCount + incorrectCount > 0;
  const finishesDay = !alreadyStudied && othersMarked === dayTotal - 1;

  // Warm the audio cache for every 🔊 on this page as soon as it loads, so
  // the first tap plays instantly instead of waiting on a cold TTS synthesis.
  useEffect(() => {
    prefetchKorean([word.korean, word.example_kr, ...word.moreExamples.map((ex) => ex.kr)]);
  }, [word.korean, word.example_kr, word.moreExamples]);

  // Tapping "Got it" while already checked undoes it (back to still
  // learning); any other tap sets the state the button says.
  async function mark(gotIt: boolean) {
    const next = gotIt && marked ? false : gotIt;
    setSaving(gotIt ? "got-it" : "next");
    setSaveFailed(false);
    const supabase = createClient();
    const nb = nextBox(box, next);
    try {
      const { error } = await supabase.from("vocabulary_progress").upsert(
        {
          user_id: userId,
          word_key: word.key,
          correct_count: correctCount + (next ? 1 : 0),
          incorrect_count: incorrectCount + (next ? 0 : 1),
          last_reviewed_at: new Date().toISOString(),
          box: nb,
          next_review_at: nextReviewAt(nb),
        },
        { onConflict: "user_id,word_key" }
      );
      if (error) {
        setSaveFailed(true);
        return;
      }
      setMarked(next);
      if (finishesDay) await payOutDay(next);
    } catch {
      setSaveFailed(true);
    } finally {
      // Both buttons key off `saving`; leaving it set stranded the learner on
      // the word with no way forward.
      setSaving(null);
    }
  }

  // All ten words of the Day are now answered. Pays XP and — through the
  // reward ledger keyed per Day (migration 0063) — the Day's coins, then
  // shows the result screen. The accuracy passed here is the share answered
  // "got it": a Day clicked through entirely as "still learning" is below the
  // server's 60% gate and earns XP but no coins.
  async function payOutDay(lastGotIt: boolean) {
    const known = othersGotIt + (lastGotIt ? 1 : 0);
    let levelUp: ProgressResult | null = null;
    try {
      levelUp = await recordCompletion(
        createClient(),
        "vocabulary",
        MINUTES_PER_SESSION,
        0,
        vocabChapterKey(topicKey, level, dayIndex),
        Math.round((known / dayTotal) * 100),
      );
    } catch {
      // The word itself is already saved; a failed payout must not take the
      // learner's progress or the result screen down with it.
    }
    setDayResult({ known, levelUp });
  }

  function goNext() {
    router.push(nextHref ?? unitHref);
  }

  // Add-to-word-bank: flags the row saved with untouched counts, so picking a
  // word never looks like a review the learner didn't do. The bank is capped,
  // so a full bank refuses the add and says where to make room.
  async function addToBank() {
    if (adding || inBank) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await saveToBank(createClient(), userId, word.key);
      if (!res.ok) {
        if (res.reason === "full") setSavedCount(res.used);
        setAddError(res.reason);
        return;
      }
      setSavedCount((n) => n + 1);
      setInBank(true);
    } catch {
      setAddError("error");
    } finally {
      // Has to be released here: saveToBank *rejecting* (offline, dropped
      // connection) used to skip setAdding(false) entirely, leaving the
      // button disabled for good with no message — a reload was the only way
      // out. Same shape as AddToMyWords, which already got this right.
      setAdding(false);
    }
  }

  if (dayResult) {
    const tricky = dayTotal - dayResult.known;
    return (
      <ResultShell
        color={VIOLET}
        categoryLabel={tn("vocabulary")}
        meta={t("dayN", { n: dayIndex + 1 })}
        ring={
          <ResultRing
            pct={Math.round((dayResult.known / dayTotal) * 100)}
            center={dayResult.known}
            unit={`/${dayTotal}`}
            label={t("summary.markedKnown")}
            color={VIOLET}
          />
        }
        headline={t("summary.title", { count: dayTotal })}
        sub={t("summary.sub")}
        tags={
          <>
            {tricky > 0 && (
              <ResultTag tone="warn">
                {t("stillLearning")} · {tricky}
              </ResultTag>
            )}
            <ResultTag>{t("dayN", { n: dayIndex + 1 })}</ResultTag>
          </>
        }
        levelUp={dayResult.levelUp}
        xpValue={XP_POINTS.vocabulary}
        xpLabel={tu("xpEarned", { skill: tn("vocabulary") })}
        actions={
          <>
            <Link
              href={`/vocabulary?level=${level}`}
              className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors"
            >
              {tu("chooseAnother")}
            </Link>
            {hasNextDay && (
              <Link
                href={`/vocabulary/${topicKey}/word?level=${level}&chapter=${dayIndex + 1}&i=0`}
                className={BTN_LINE}
              >
                {t("summary.moreWords", { count: dayTotal })}
              </Link>
            )}
          </>
        }
      />
    );
  }

  return (
    <div className="max-w-[600px]">
      <div className="flex items-center justify-between gap-3 mb-3.5">
        {backHref ? (
          <Link href={backHref} className="text-[12.5px] text-muted hover:text-charcoal transition-colors">
            ← {backLabel ?? t("detail.back")}
          </Link>
        ) : fromBank ? (
          <Link href="/review/words" className="text-[12.5px] text-muted hover:text-charcoal transition-colors">
            ← {t("bank.backToMyBank")}
          </Link>
        ) : (
          <span />
        )}
        <span className="text-[12.5px] text-muted flex-none">
          {topicLabel} · {level}
        </span>
      </div>

      {/* The guided tour spotlights this whole card for the "read it" step —
          the copy talks about the word, its meaning and the example, so the
          ring has to cover them rather than just the Got it button. */}
      <div
        data-tour="guided-word-card"
        className="relative bg-cream border border-line rounded-[6px] shadow-[0_20px_40px_-28px_rgba(60,50,30,.6)] overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: RULED }} aria-hidden="true" />
        <span
          className="absolute top-0 bottom-0 left-[clamp(28px,6vw,52px)] w-px bg-[var(--tint-rose-line)] opacity-70 pointer-events-none"
          aria-hidden="true"
        />
        {marked && (
          <span
            aria-label={t("gotIt")}
            className="absolute top-3.5 right-4 w-9 h-9 rounded-full bg-success flex items-center justify-center shadow-[0_4px_0_var(--color-success-deep)] rotate-[-6deg] select-none"
          >
            <svg viewBox="0 0 16 16" className="w-[18px] h-[18px]" aria-hidden="true">
              <path
                d="M3.2 8.4 6.4 11.6 12.8 5.2"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}

        <div className="relative pt-6 pb-5 pr-[clamp(18px,4vw,26px)] pl-[clamp(40px,8vw,70px)]">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-start mb-1 pr-16">
            <div>
              <p className="kr font-black text-[clamp(34px,6vw,44px)] leading-[1.1] tracking-[-0.01em]">
                <button
                  type="button"
                  onClick={() => speakKorean(word.korean)}
                  title={t("session.hearIt")}
                  className="inline-flex items-baseline gap-2 hover:text-[#6B33CC] transition-colors text-left"
                >
                  {word.korean}
                  <span aria-hidden="true" className="text-[16px] translate-y-[-6px] opacity-70">🔊</span>
                </button>
              </p>
              <p className="text-[13px] text-faint mt-0.5">{word.romanization}</p>
            </div>
            {hanja && (
              <span
                className="kr font-black text-[clamp(36px,6vw,52px)] leading-none text-[#A08F4E] opacity-55 tracking-[.04em] select-none"
                aria-label={t("session.hanjaAria", { hanja })}
              >
                {hanja}
              </span>
            )}
          </div>

          <p className="text-[20px] font-extrabold mt-2.5 mb-1.5">{getLocalizedMeaning(word, locale)}</p>

          {note?.parts && (
            <p className="text-[12.5px] text-muted leading-[1.65] mb-3">
              {note.parts.map((p, i) => (
                <span key={p.syllable + p.hanja}>
                  {i > 0 && <span className="mx-1.5 text-faint">+</span>}
                  <b className="kr text-charcoal">{p.syllable}</b>{" "}
                  <span className="kr text-[#A08F4E]">{p.hanja}</span> {p.gloss}
                </span>
              ))}
            </p>
          )}
          {note?.origin && <p className="text-[12.5px] text-muted leading-[1.65] mb-3">{t("session.origin", { origin: note.origin })}</p>}

          <div className="border-l-[3px] border-[var(--tint-violet-line)] pl-3.5 py-1 my-2 mb-3.5">
            <p className="kr text-[16px] font-medium">
              <button
                type="button"
                onClick={() => speakKorean(word.example_kr)}
                title={t("session.hearSentence")}
                className="text-left hover:text-[#6B33CC] transition-colors"
              >
                {word.example_kr} <span aria-hidden="true" className="text-[11px] opacity-70">🔊</span>
              </button>
            </p>
            <p className="text-[12.5px] text-muted">{getLocalizedExampleEn(word, locale)}</p>
          </div>

          {word.moreExamples.length > 0 && (
            <div className="grid gap-2 mb-2">
              {word.moreExamples.map((ex, i) => (
                <div
                  key={i}
                  className="bg-[var(--tint-amber)] border border-amber-line rounded-[6px] px-3 py-2.5 text-left"
                >
                  <p className="text-[10px] font-bold tracking-[0.07em] uppercase text-[#A08F4E] mb-1">
                    {ex.source === "reading" ? tw("seenInReading") : tw("seenInListening")}
                  </p>
                  <p className="kr text-[13px] font-medium text-charcoal leading-[1.45]">
                    <button
                      type="button"
                      onClick={() => speakKorean(ex.kr)}
                      title={t("session.hearSentence")}
                      className="text-left hover:text-[#6B33CC] transition-colors"
                    >
                      {ex.kr}
                    </button>
                  </p>
                  <p className="text-[11.5px] text-muted leading-[1.45]">{ex.en}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* actions — a bar under the page, full card width, so the thumb
          doesn't have to reach into the card and the screen isn't half empty */}
      <div className="grid grid-cols-2 gap-2 mt-3.5">
        <button type="button" className={`${BTN_LINE} w-full justify-center`} disabled={saving !== null} onClick={() => mark(false)}>
          {saving === "next" ? tu("saving") : t("stillLearning")}
        </button>
        <button
          type="button"
          data-tour="guided-word-goti"
          className={`${marked ? BTN_LINE : BTN_INK} w-full justify-center`}
          disabled={saving !== null}
          onClick={() => mark(true)}
        >
          {saving === "got-it" ? tu("saving") : t("gotIt")}
        </button>
      </div>

      {/* Looked up from a reading passage, there's no next word to page to —
          nextHref is always null and unitHref would just dump the learner
          into an unrelated vocab unit. The back-to-story link above already
          covers "done here". */}
      {!backHref && (
        <button
          type="button"
          onClick={goNext}
          className={`${BTN_INK} w-full justify-center mt-2`}
        >
          {t("detail.next")}
        </button>
      )}

      {saveFailed && (
        <p role="status" className="mt-2 text-[12.5px] text-danger text-center">
          {t("saveFailed")}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 mt-3 text-[12.5px]">
        {prevHref ? (
          <Link href={prevHref} className="font-semibold text-muted hover:text-charcoal transition-colors whitespace-nowrap">
            ← {t("detail.prev")}
          </Link>
        ) : (
          <span />
        )}
        {/* The add button swaps into this saved state in place — a fast tap's
            trailing click used to land after that swap and fire whatever was
            now underneath, so this stayed a static status. It's a real
            button now instead, but only ever rendered after `inBank` is
            already true on a prior render, so that same-tap race can't
            reach it: a tap here is always a separate, deliberate tap. */}
        {inBank ? (
          <button
            type="button"
            data-tour="guided-word-bank"
            onClick={() => router.push("/review/words")}
            className="min-w-0 inline-flex items-center gap-1.5 rounded-[10px] border border-success-line bg-success-bg px-3 py-2 font-semibold text-success-deep hover:bg-success-line transition-colors"
          >
            <span className="truncate">{t("bank.savedWithCount", { used: savedCount, slots })}</span>
          </button>
        ) : addError === "full" ? (
          <span
            data-tour="guided-word-bank"
            className="min-w-0 inline-flex items-center gap-1.5 rounded-[10px] border border-amber-line bg-[var(--tint-amber)] px-3 py-2 font-semibold text-[#B7791F]"
          >
            <span className="truncate">{t("bank.fullShort", { used: savedCount, slots })}</span>
          </span>
        ) : (
          <button
            type="button"
            data-tour="guided-word-bank"
            onClick={() => void addToBank()}
            disabled={adding}
            aria-busy={adding}
            className="min-w-0 inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-cream px-3 py-2 font-semibold text-muted hover:border-faint hover:text-charcoal transition-colors disabled:opacity-60"
          >
            <span className="truncate">
              {adding ? tu("saving") : addError === "error" ? t("bank.addFailed") : `＋ ${tu("addToMyWords")}`}
            </span>
          </button>
        )}
      </div>

      {!nextHref && !backHref && (
        <div className="mt-2.5 text-right text-[12.5px]">
          <Link href={unitHref} className="font-semibold text-muted hover:text-charcoal transition-colors">
            {t("detail.backToUnit")} →
          </Link>
        </div>
      )}
    </div>
  );
}
