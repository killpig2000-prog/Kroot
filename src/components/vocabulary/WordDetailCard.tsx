"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import ResultShell, { ResultRing, ResultTag } from "@/components/results/ResultShell";
import { createClient } from "@/lib/supabase/client";
import { playCorrect, playWrong } from "@/lib/sfx";
import { recordCompletion, XP_POINTS, type ProgressResult } from "@/lib/activity";
import { vocabChapterKey } from "@/lib/reward-keys";
import { nextBox, nextReviewAt } from "@/lib/srs";
import { MINUTES_PER_SESSION } from "@/lib/vocabulary";
import { saveToBank } from "@/lib/word-bank";
import { speakKorean, prefetchKorean } from "@/lib/tts";
import { getWordNote, hanjaOf } from "@/lib/word-notes";
import { getLocalizedMeaning, getLocalizedExampleEn } from "@/lib/vocabulary-i18n";
import { textBadgeFor, wordArtFor } from "@/lib/word-art";
import WordTrace, { canTraceWord } from "@/components/vocabulary/WordTrace";

const BTN_INK = buttonClassName("ink");
const BTN_LINE = buttonClassName("line");
const BTN_AMBER = buttonClassName("amber");
const VIOLET = "var(--tint-violet-ink)";

// Ruled notebook paper: a faint line every 32px, plus a red margin rule.
// Brought back 2026-09-08 (user call: the memo-pad card read better than
// the plain one the fidelity pass replaced it with).
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
  level,
  prevHref,
  nextHref,
  inBank: initialInBank,
  savedCount: initialSavedCount,
  slots,
  backHref,
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
  level: string;
  prevHref: string | null;
  nextHref: string | null;
  /** Whether this word is one of the learner's picked words. */
  inBank: boolean;
  /** How many words the bank holds right now, and how many it can hold. */
  savedCount: number;
  slots: number;
  /** Where the learner came from, when it wasn't a vocabulary unit (e.g. a
      reading passage, or the word bank) — the lesson bar's back arrow uses
      it instead of the unit link. */
  backHref?: string | null;
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
  const [inBank, setInBank] = useState(initialInBank);
  const [savedCount, setSavedCount] = useState(initialSavedCount);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<"full" | "error" | null>(null);
  const note = getWordNote(word.korean);
  const hanja = hanjaOf(word.korean);
  // A1/A2 get a hand-drawn picture above the word (public/word-art); B1+ is
  // text only. Either way the first meeting ends with writing the word.
  const art = wordArtFor(word.korean, level);
  // No picture on purpose (people/roles): the word itself grows into the
  // picture's slot and a one-line note sits under the meaning, so the card
  // is as tall as a pictured one and doesn't look unfinished next to it.
  const badge = art ? null : textBadgeFor(word.korean, level);
  const traceable = canTraceWord(word.korean);
  const meaning = getLocalizedMeaning(word, locale);
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
  // Whether this word has been rated at all (either way) — `marked` alone
  // can't tell "never touched" from "rated still-learning", since both are
  // `false`. Without this, tapping Still learning on a fresh word gave zero
  // visible feedback: Got it's button visibly toggles ink/line on `marked`,
  // but Still learning's button never changed at all. Now it starts amber
  // (an unanswered word still needs a rating) and fades to the plain line
  // style the instant either button has been tapped, same "answered, no
  // longer asking for attention" language Got it's own ink→line fade uses.
  const [answered, setAnswered] = useState(correctCount + incorrectCount > 0);
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
    // `alreadyStudied` is what tells box 1 apart from "no box yet": a first
    // ever "Got it" earns box 1 (back tomorrow), not box 2's three days.
    const nb = nextBox(box, next, alreadyStudied);
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
      setAnswered(true);
      if (next) playCorrect();
      else playWrong();
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
        level,
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
        sound="day"
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
        {/* The checkmark badge only ever covered "got it" — a still-learning
            rating left the same corner blank, so the card gave no sign it had
            recorded anything at all. This mirrors it in amber with a "coming
            back around" arrow instead of a check, matching the amber
            still-learning button below. */}
        {answered && !marked && (
          <span
            aria-label={t("stillLearning")}
            className="absolute top-3.5 right-4 w-9 h-9 rounded-full bg-amber flex items-center justify-center shadow-[0_4px_0_var(--c-amber-deep)] rotate-[-6deg] select-none"
          >
            <svg viewBox="0 0 16 16" className="w-[18px] h-[18px]" aria-hidden="true">
              <path
                d="M2.8 8A5.2 5.2 0 1 1 4.4 11.8"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M2.8 4.6v3.6h3.6"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}

        <div className="relative pt-6 pb-5 pr-[clamp(18px,4vw,26px)] pl-[clamp(40px,8vw,70px)]">
          {/* The word's hero, laid out like the restructure mockup's card:
              picture, word, romanization, meaning, then the listen pill —
              centred, one under the other. Its px are the mockup's scaled
              1.45× from its 268px phone frame to a real 390px one. A word
              with no picture (people/roles) grows into the picture's slot
              instead, so both cards are the same height. */}
          {hanja && (
            <span
              className={`kr absolute top-6 ${answered ? "right-[58px]" : "right-[clamp(18px,4vw,26px)]"} font-black text-[clamp(36px,6vw,52px)] leading-none text-[#A08F4E] opacity-55 tracking-[.04em] select-none`}
              aria-label={t("session.hanjaAria", { hanja })}
            >
              {hanja}
            </span>
          )}

          {/* Picture on the left, the word beside it — the stacked version
              spent 276px on five centred rows (2026-09-08 measurement at
              390px) for the same five things. Hearing the word belongs to
              the word, so the speaker sits on its line rather than in a pill
              of its own underneath. A word with no picture (people, roles)
              keeps the wide centred treatment: it has nothing to sit next
              to, and its own letters are the picture. */}
          <div
            className={`mb-[13px] ${
              art ? "flex items-center gap-[14px] text-left" : "flex flex-col items-center text-center gap-[9px]"
            }`}
          >
            {art && (
              // eslint-disable-next-line @next/next/no-img-element -- static SVG in /public, no optimisation needed
              <img
                src={art}
                alt={meaning}
                loading="lazy"
                decoding="async"
                className="block flex-none"
                style={{ width: "clamp(96px, 29vw, 124px)", height: "clamp(96px, 29vw, 124px)" }}
              />
            )}
            <div className={art ? "min-w-0 flex-1" : "flex flex-col items-center gap-[9px]"}>
              <div className={`flex items-center gap-[9px] ${art ? "" : "justify-center"}`}>
                <p
                  className={`kr font-black leading-[1.1] tracking-[-0.01em] ${
                    badge ? "text-[clamp(52px,15vw,68px)]" : "text-[clamp(38px,11vw,46px)]"
                  }`}
                  style={badge ? { minHeight: "clamp(96px, 29vw, 120px)", display: "flex", alignItems: "center" } : undefined}
                >
                  {word.korean}
                </p>
                <button
                  type="button"
                  onClick={() => speakKorean(word.korean)}
                  aria-label={t("session.hearIt")}
                  title={t("session.hearIt")}
                  className="flex-none w-9 h-9 rounded-full border border-line bg-cream text-[16px] leading-none flex items-center justify-center text-success hover:border-success transition-colors"
                >
                  🔊
                </button>
              </div>
              <p className="text-[15px] text-faint mt-0.5">{word.romanization}</p>
              <p className="text-[18px] font-extrabold leading-snug mt-1">{meaning}</p>
              {badge && (
                <p className="kr text-[14px] text-muted leading-[1.5] bg-cream border border-line rounded-[12px] px-[13px] py-[6px] max-w-[34ch] mt-2">
                  {badge}
                </p>
              )}
            </div>
          </div>

          {/* write it — the Hangul tab lives here now: trace the word
              syllable by syllable on the /hangul paper. Only the opener sits
              in the card; the paper itself is a sheet (phone) / modal
              (desktop), because in the card it was 505px of an 882px card
              and the one reason this page scrolled past a screen. */}
          {traceable && (
            <WordTrace key={word.key} korean={word.korean} rom={word.romanization} meaning={meaning} />
          )}

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
                className="text-left hover:text-[var(--tint-violet-ink)] transition-colors"
              >
                {word.example_kr} <span aria-hidden="true" className="text-[11px] opacity-70">🔊</span>
              </button>
            </p>
            <p className="text-[12.5px] text-muted">{getLocalizedExampleEn(word, locale)}</p>
          </div>

          {word.moreExamples.map((ex, i) => (
            <div key={i} className="border-l-[3px] border-[var(--tint-violet-line)] pl-3.5 py-1 my-2 mb-3.5">
              <p className="kr text-[16px] font-medium">
                <button
                  type="button"
                  onClick={() => speakKorean(ex.kr)}
                  title={t("session.hearSentence")}
                  className="text-left hover:text-[var(--tint-violet-ink)] transition-colors"
                >
                  {ex.kr} <span aria-hidden="true" className="text-[11px] opacity-70">🔊</span>
                </button>
              </p>
              <p className="text-[12.5px] text-muted">{ex.en}</p>
            </div>
          ))}

        </div>
      </div>

      {/* actions — a bar under the page, full card width, so the thumb
          doesn't have to reach into the card and the screen isn't half empty */}
      <div className="grid grid-cols-2 gap-2 mt-3.5">
        <button
          type="button"
          className={`${answered ? BTN_LINE : BTN_AMBER} w-full justify-center`}
          disabled={saving !== null}
          onClick={() => mark(false)}
        >
          {saving === "next" ? tu("saving") : t("stillLearning")}
        </button>
        <button
          type="button"
          data-tour="guided-word-goti"
          className={`${answered ? BTN_LINE : BTN_INK} w-full justify-center`}
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
          <button
            type="button"
            onClick={() => {
              router.push(unitHref);
              router.refresh();
            }}
            className="font-semibold text-muted hover:text-charcoal transition-colors"
          >
            {t("detail.backToUnit")} →
          </button>
        </div>
      )}
    </div>
  );
}
