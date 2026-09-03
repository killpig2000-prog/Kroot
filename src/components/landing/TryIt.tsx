"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { bestSimilarity, verdictFor } from "@/lib/speech-match";
import { wordsForChapter } from "@/lib/pronunciation";
import { checkTiles, type Board } from "@/lib/writing-builder";
import { TileBoard } from "@/components/writing/WritingBoards";
import AnswerCapture from "@/components/pronunciation/AnswerCapture";
import ScoreResult, { VERDICTS } from "@/components/pronunciation/ScoreResult";
import { speakKorean } from "@/lib/tts";

// The hero's "try it right now" pair — one pronunciation word and one easy
// tile sentence, both graded entirely in the browser. No account, no API
// call. The pronunciation card is the real practice card, piece for piece:
// the same AnswerCapture mic + countdown ring and the same ScoreResult
// gauge the Pronunciation Trail uses, fed by the same hooks — not a
// look-alike. The word and the board are fixed constants so the server
// render and the first client render agree.

// The very first word of the real trail (chapter 1, ㄹ), with its actual
// chapter tip — so what you try here is literally what lesson one asks.
const WORD = wordsForChapter("rieul")[0];
// Must match AnswerCapture's own MAX_LISTEN_MS so the ring runs out exactly
// when the mic stops.
const MAX_LISTEN_MS = 6000;

// 나는 한국을 사랑해요 (I love Korea). No distractor on purpose — the user
// wanted the landing sample to be only the words that belong.
const BOARD: Board = {
  answer: ["나는", "한국을", "사랑해요"],
  tiles: [
    { id: "t1", text: "한국을" },
    { id: "t2", text: "사랑해요" },
    { id: "t0", text: "나는" },
  ],
};

const CARD =
  "text-left bg-cream border border-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] flex flex-col";
const LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2";
const EYEBROW = "text-[10.5px] font-extrabold tracking-[.08em] uppercase mb-2";

function PronunciationCard({ onDone }: { onDone: () => void }) {
  const t = useTranslations("pronunciation.practice");
  const router = useRouter();
  const { speak, isSpeaking, isSupported: ttsOk } = useKoreanSpeaker();
  const { isSupported: micOk, isListening, listenStartedAt, interim, error, listen } = useSpeechRecognition(
    "ko-KR",
    MAX_LISTEN_MS
  );
  const [heard, setHeard] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  // Ticks the mic countdown ring while listening — same as the real card.
  const [micElapsedMs, setMicElapsedMs] = useState(0);
  useEffect(() => {
    if (!isListening || listenStartedAt === null) return;
    let raf: number;
    const tick = () => {
      setMicElapsedMs(performance.now() - listenStartedAt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isListening, listenStartedAt]);

  // Animates the score gauge counting up whenever a fresh grade comes in.
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    if (heard === null) return;
    const target = Math.round(score * 100);
    const start = performance.now();
    const DURATION = 550;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setAnimScore(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heard, score]);

  function grade(text: string) {
    // Same grading as PronunciationChallenge: the chapter word, nothing looser.
    const s = bestSimilarity(text, [WORD.kr]);
    setHeard(text);
    setScore(s);
    onDone();
  }

  const verdict = heard !== null ? VERDICTS[verdictFor(score)] : null;

  return (
    <div className={`${CARD} border-teal/40`}>
      <div className="flex items-center justify-between mb-4 gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-teal bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-full px-2.5 py-[3px]">
          {WORD.groupTitle}
        </span>
        <span className="text-[12.5px] text-faint font-medium">{t("wordOf", { n: 1, total: 6 })}</span>
      </div>

      <p className={LABEL}>{t("sayThis")}</p>
      <p className="kr font-bold text-[34px] tracking-[-0.01em] leading-[1.2] mb-1">{WORD.kr}</p>
      <p className="text-[13.5px] text-muted mb-4">
        <span className="italic">{WORD.romanization}</span> · {WORD.en}
      </p>

      <div className="flex items-start gap-3 bg-warm border border-line rounded-xl px-[18px] py-3.5 mb-4">
        <button
          aria-label={t("hearIt")}
          className="w-11 h-11 rounded-full flex-none bg-teal text-white text-[17px] flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50"
          onClick={() => speak(WORD.kr)}
          disabled={!ttsOk}
        >
          🔊
        </button>
        <div className="min-w-0">
          <b className="block text-[11px] font-bold tracking-[.06em] text-faint mb-0.5">{t("howToMakeIt")}</b>
          <p className="text-[13px] text-muted leading-[1.5]">{WORD.tip}</p>
        </div>
        {isSpeaking && <span className="ml-auto flex-none text-[12px] font-semibold text-teal wave-on">{t("speaking")}</span>}
      </div>

      {heard === null && (
        <AnswerCapture
          bestScore={0}
          micOk={micOk}
          isListening={isListening}
          micElapsedMs={micElapsedMs}
          interim={interim}
          error={error}
          onListen={() => listen(grade)}
          onSkip={() => {}}
        />
      )}

      {heard !== null && verdict && (
        <ScoreResult
          heard={heard}
          targetKr={WORD.kr}
          verdict={verdict}
          animScore={animScore}
          saveError={null}
          ttsOk={ttsOk}
          onReplay={() => speak(WORD.kr)}
          onTryAgain={() => setHeard(null)}
          // "Finish →" on the landing sample hands over to the real thing.
          onNext={() => router.push("/onboarding")}
          isLastWord
        />
      )}
    </div>
  );
}

function WritingCard({ onDone }: { onDone: () => void }) {
  const t = useTranslations("landing.tryIt");
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);

  function check() {
    const ok = checkTiles(BOARD, picked);
    setChecked(ok);
    if (ok) {
      speakKorean(BOARD.answer.join(" "), { rate: 0.9 });
      onDone();
    }
  }

  return (
    <div className={`${CARD} border-amber-line`}>
      <p className={`${EYEBROW} text-amber`}>✍️ {t("writeTitle")}</p>
      <p className="text-[15px] font-bold text-charcoal leading-snug mb-0.5">{t("writePrompt")}</p>
      <p className="text-[12.5px] text-muted mb-4">{t("writeHint")}</p>
      <TileBoard
        board={BOARD}
        picked={picked}
        checked={checked}
        onChange={(next) => {
          setPicked(next);
          if (checked === false) setChecked(null);
        }}
        onCheck={check}
        onReset={() => {
          setPicked([]);
          setChecked(null);
        }}
      />
    </div>
  );
}

export default function TryIt() {
  const t = useTranslations("landing.tryIt");
  const [done, setDone] = useState({ pron: false, write: false });
  const finished = done.pron || done.write;

  return (
    <div className="mb-8 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[760px] mx-auto items-start">
        <PronunciationCard onDone={() => setDone((d) => ({ ...d, pron: true }))} />
        <WritingCard onDone={() => setDone((d) => ({ ...d, write: true }))} />
      </div>
      {/* the real CTA button sits under the headline below, so this is just
          the bridge line — no second link competing with it */}
      {finished && (
        <p className="text-center mt-4 text-[13.5px] font-semibold text-success-deep" aria-live="polite">
          {t("afterTry")} ↓
        </p>
      )}
    </div>
  );
}
