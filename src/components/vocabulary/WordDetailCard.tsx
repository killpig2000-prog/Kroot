"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { nextBox, nextReviewAt } from "@/lib/srs";
import { saveToBank } from "@/lib/word-bank";
import { speakKorean, prefetchKorean } from "@/lib/tts";
import { WORD_STATUSES, getWordNote, wordStatus, hanjaOf } from "@/lib/word-notes";
import { getLocalizedMeaning, getLocalizedExampleEn } from "@/lib/vocabulary-i18n";

const BTN_INK = buttonClassName("ink");
const BTN_LINE = buttonClassName("line");

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

// A read-only dictionary entry for a single word — reached by tapping a row
// in the unit preview. Unlike the study card (FlipPhase), the meaning is
// shown right away: this is a lookup. "Got it" / "Still learning" record the
// same SRS progress the study session does and step to the next word.
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
}) {
  const router = useRouter();
  const t = useTranslations("vocabulary");
  const tu = useTranslations("ui");
  const tw = useTranslations("words");
  const [inBank, setInBank] = useState(initialInBank);
  const [savedCount, setSavedCount] = useState(initialSavedCount);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<"full" | "error" | null>(null);
  const status = WORD_STATUSES[wordStatus(correctCount + incorrectCount)];
  const note = getWordNote(word.korean);
  const hanja = hanjaOf(word.korean);
  // Which button is mid-save, so it can say so instead of just greying out.
  const [saving, setSaving] = useState<"next" | "got-it" | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  // Warm the audio cache for every 🔊 on this page as soon as it loads, so
  // the first tap plays instantly instead of waiting on a cold TTS synthesis.
  useEffect(() => {
    prefetchKorean([word.korean, word.example_kr, ...word.moreExamples.map((ex) => ex.kr)]);
  }, [word.korean, word.example_kr, word.moreExamples]);

  async function advance(gotIt: boolean) {
    setSaving(gotIt ? "got-it" : "next");
    setSaveFailed(false);
    const supabase = createClient();
    const nb = nextBox(box, gotIt);
    try {
      const { error } = await supabase.from("vocabulary_progress").upsert(
        {
          user_id: userId,
          word_key: word.key,
          correct_count: correctCount + (gotIt ? 1 : 0),
          incorrect_count: incorrectCount + (gotIt ? 0 : 1),
          last_reviewed_at: new Date().toISOString(),
          box: nb,
          next_review_at: nextReviewAt(nb),
        },
        { onConflict: "user_id,word_key" }
      );
      // Moving on would hide the loss: the word would come back unprogressed
      // days later with nothing to explain it. Stay put so the tap can be
      // repeated.
      if (error) {
        setSaveFailed(true);
        return;
      }
      router.push(nextHref ?? unitHref);
    } catch {
      setSaveFailed(true);
    } finally {
      // Both buttons key off `saving`; leaving it set stranded the learner on
      // the word with no way forward.
      setSaving(null);
    }
  }

  // Add-to-word-bank: flags the row saved with untouched counts, so picking a
  // word never looks like a review the learner didn't do. The bank is capped,
  // so a full bank refuses the add and says where to make room.
  async function addToBank() {
    if (adding || inBank) return;
    setAdding(true);
    setAddError(null);
    const res = await saveToBank(createClient(), userId, word.key);
    setAdding(false);
    if (!res.ok) {
      if (res.reason === "full") setSavedCount(res.used);
      setAddError(res.reason);
      return;
    }
    setSavedCount((n) => n + 1);
    setInBank(true);
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
          <Link href={unitHref} className="text-[12.5px] text-muted hover:text-charcoal transition-colors">
            ← {unitLabel}
          </Link>
        )}
        <span className="text-[12.5px] text-muted flex-none">
          {topicLabel} · {level}
        </span>
      </div>

      <div className="relative bg-cream border border-line rounded-[6px] shadow-[0_20px_40px_-28px_rgba(60,50,30,.6)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: RULED }} aria-hidden="true" />
        <span
          className="absolute top-0 bottom-0 left-[clamp(28px,6vw,52px)] w-px bg-[var(--tint-rose-line)] opacity-70 pointer-events-none"
          aria-hidden="true"
        />
        <span className="absolute top-4 right-5 text-[10.5px] font-black tracking-[.06em] uppercase text-amber border-2 border-amber rounded-[6px] px-2 py-[3px] rotate-[-6deg] opacity-80 select-none">
          {t(status.key)}
        </span>

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
        <button type="button" className={`${BTN_LINE} w-full justify-center`} disabled={saving !== null} onClick={() => advance(false)}>
          {saving === "next" ? tu("saving") : t("stillLearning")}
        </button>
        <button type="button" className={`${BTN_INK} w-full justify-center`} disabled={saving !== null} onClick={() => advance(true)}>
          {saving === "got-it" ? tu("saving") : t("gotIt")}
        </button>
      </div>

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
          <Link href={unitHref} className="font-semibold text-muted hover:text-charcoal transition-colors whitespace-nowrap">
            ← {t("detail.backToUnit")}
          </Link>
        )}
        {/* The saved/full states replace the add button in place, so they must
            never be links: a tap's trailing click lands ~50-300ms after
            touchend, by which time React has swapped the element — the word
            got saved AND the learner was thrown to /review/words. They stay
            plain status now; the sidebar carries the way to the word bank. */}
        {inBank ? (
          <span className="min-w-0 inline-flex items-center gap-1.5 rounded-[10px] border border-success-line bg-success-bg px-3 py-2 font-semibold text-success-deep">
            <span className="truncate">{t("bank.savedWithCount", { used: savedCount, slots })}</span>
          </span>
        ) : addError === "full" ? (
          <span className="min-w-0 inline-flex items-center gap-1.5 rounded-[10px] border border-amber-line bg-[var(--tint-amber)] px-3 py-2 font-semibold text-[#B7791F]">
            <span className="truncate">{t("bank.fullShort", { used: savedCount, slots })}</span>
          </span>
        ) : (
          <button
            type="button"
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

      {!nextHref && (
        <div className="mt-2.5 text-right text-[12.5px]">
          <Link href={unitHref} className="font-semibold text-muted hover:text-charcoal transition-colors">
            {t("detail.backToUnit")} →
          </Link>
        </div>
      )}
    </div>
  );
}
