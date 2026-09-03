"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useKoreanSpeaker, useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { bestSimilarity, verdictFor, type Verdict } from "@/lib/speech-match";
import { checkTiles, type Board } from "@/lib/writing-builder";
import { TileBoard } from "@/components/writing/WritingBoards";
import { speakKorean } from "@/lib/tts";

// The hero's "try it right now" pair — one pronunciation word and one
// easy tile sentence, both graded entirely in the browser. No account, no
// API call: the mic goes through Web Speech recognition and is scored with
// the same jamo-similarity the real Pronunciation Trail uses; the sentence
// is checked with the same checkTiles the Writing session uses. The word
// and the board are fixed constants so the server render and the first
// client render agree (no hydration mismatch from a shuffle).

const WORD = { kr: "안녕", accept: ["안녕", "안녕하세요"] };
const MAX_LISTEN_MS = 5000;

// 저는 물을 마셔요 (I drink water) + one distractor, pre-shuffled by hand.
const BOARD: Board = {
  answer: ["저는", "물을", "마셔요"],
  tiles: [
    { id: "t1", text: "물을" },
    { id: "t0", text: "저는" },
    { id: "t3", text: "빵을" },
    { id: "t2", text: "마셔요" },
  ],
};

const CARD =
  "text-left bg-cream border border-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] flex flex-col";
const EYEBROW = "text-[10.5px] font-extrabold tracking-[.08em] uppercase mb-2";

const VERDICT_STYLE: Record<Verdict, string> = {
  great: "text-success-deep",
  close: "text-amber",
  again: "text-danger",
};

function ScoreRing({ pct }: { pct: number }) {
  return (
    <div
      className="w-[72px] h-[72px] rounded-full flex items-center justify-center flex-none"
      style={{ background: `conic-gradient(var(--c-success) ${pct * 3.6}deg, var(--c-line) 0)` }}
    >
      <div className="w-[58px] h-[58px] rounded-full bg-cream flex items-center justify-center">
        <span className="font-extrabold text-[20px] leading-none text-success-deep tabular-nums">{pct}</span>
      </div>
    </div>
  );
}

function PronunciationCard({ onDone }: { onDone: () => void }) {
  const t = useTranslations("landing.tryIt");
  const { speak, isSpeaking } = useKoreanSpeaker();
  const { isSupported, isListening, interim, error, listen } = useSpeechRecognition("ko-KR", MAX_LISTEN_MS);
  const [heard, setHeard] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  function start() {
    setHeard(null);
    listen((text) => {
      const s = bestSimilarity(text, WORD.accept);
      setHeard(text);
      setScore(s);
      onDone();
    });
  }

  const pct = Math.round(score * 100);
  const verdict = heard !== null ? verdictFor(score) : null;

  return (
    <div className={`${CARD} border-teal/40`}>
      <p className={`${EYEBROW} text-teal`}>🎤 {t("pronTitle")}</p>
      <p className="kr font-bold text-[36px] leading-[1.15] mb-0.5">{WORD.kr}</p>
      <p className="text-[12.5px] text-muted mb-4">{t("pronGloss")}</p>

      <div className="flex items-center gap-2.5 mb-4">
        <button
          type="button"
          onClick={() => speak(WORD.kr)}
          disabled={isSpeaking}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-warm px-3.5 py-2 text-[12.5px] font-bold text-charcoal hover:bg-cream transition-colors disabled:opacity-60"
        >
          🔊 {t("listen")}
        </button>
        {isSupported ? (
          <button
            type="button"
            onClick={start}
            disabled={isListening}
            aria-busy={isListening}
            className={`inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12.5px] font-bold text-white shadow-[0_3px_0_#0f766e] transition-all ${
              isListening ? "bg-teal/70 animate-pulse" : "bg-teal hover:translate-y-px hover:shadow-[0_2px_0_#0f766e]"
            }`}
          >
            🎤 {isListening ? t("listening") : heard !== null ? t("tryAgain") : t("speak")}
          </button>
        ) : (
          <span className="text-[11.5px] text-faint leading-snug">{t("noMic")}</span>
        )}
      </div>

      {isListening && interim && (
        <p className="kr text-[13px] text-muted mb-2" aria-live="polite">
          {interim}
        </p>
      )}
      {error && !isListening && heard === null && (
        <p className="text-[11.5px] text-danger leading-snug" aria-live="polite">
          {error}
        </p>
      )}

      {heard !== null && verdict && (
        <div className="flex items-center gap-3.5 border-t border-dashed border-line pt-3.5 mt-auto" aria-live="polite">
          <ScoreRing pct={pct} />
          <div className="min-w-0">
            <p className={`text-[14px] font-extrabold ${VERDICT_STYLE[verdict]}`}>{t(`verdict.${verdict}`)}</p>
            <p className="text-[11px] text-faint mt-0.5">
              {t("heard")} <span className="kr text-charcoal font-semibold">{heard}</span>
            </p>
          </div>
        </div>
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
    <div className="mt-8 mb-7 text-left">
      <p className="text-center text-[11.5px] font-extrabold tracking-[.1em] uppercase text-success mb-3.5">
        {t("eyebrow")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[760px] mx-auto">
        <PronunciationCard onDone={() => setDone((d) => ({ ...d, pron: true }))} />
        <WritingCard onDone={() => setDone((d) => ({ ...d, write: true }))} />
      </div>
      {/* the real CTA button sits right under this block in Hero, so this
          is just the bridge line — no second link competing with it */}
      {finished && (
        <p className="text-center mt-4 text-[13.5px] font-semibold text-success-deep" aria-live="polite">
          {t("afterTry")} ↓
        </p>
      )}
    </div>
  );
}
