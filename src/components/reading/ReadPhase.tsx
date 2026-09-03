"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import GlossedText from "@/components/reading/GlossedText";
import { countKoreanWords, MINUTES_PER_PASSAGE, type Passage, type PassageLine } from "@/lib/reading";
import { getLocalizedTitle } from "@/lib/reading-i18n";
import { speakKorean, stopSpeaking, prefetchKorean } from "@/lib/tts";
import type { Gloss } from "@/lib/word-links";

const BTN_BLUE = buttonClassName("sky", "w-full");

// How much of the English a reader wants on screen. "tap" is the default:
// struggle with a line first, then check that one line.
export type TranslationMode = "off" | "tap" | "all";

// Text size is a per-device reading preference, not session state — a reader
// who sizes up once shouldn't have to do it again next chapter.
const SIZE_KEY = "reading:text-size";
const sizeListeners = new Set<() => void>();

function readLargeText(): boolean {
  try {
    return window.localStorage.getItem(SIZE_KEY) === "large";
  } catch {
    return false;
  }
}

function subscribeLargeText(onChange: () => void): () => void {
  sizeListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    sizeListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeLargeText(large: boolean) {
  try {
    window.localStorage.setItem(SIZE_KEY, large ? "large" : "normal");
  } catch {
    // Blocked storage — the size still applies for this session.
  }
  for (const notify of sizeListeners) notify();
}

const GENRE_ICONS: Record<string, string> = {
  dialogue: "💬",
  message: "💬",
  notice: "📌",
  email: "✉️",
  interview: "🎙️",
  instruction: "📋",
  review: "⭐",
  diary: "📔",
  story: "📖",
  explainer: "💡",
  editorial: "📰",
  article: "📰",
  essay: "✍️",
  academic: "🎓",
  opinion: "💭",
};

const CHIP = "text-[11.5px] font-semibold tracking-[.04em] rounded-md px-2 py-0.5 border";
const TOOL_BTN =
  "text-[12px] font-semibold rounded-[9px] px-2.5 py-1.5 border transition-colors";

/** Speaker prefix ("민수: 안녕") → ["민수", "안녕"]; ["", line] when there is none. */
function splitSpeaker(line: string): [string, string] {
  const i = line.indexOf(":");
  if (i === -1) return ["", line];
  return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
}

export default function ReadPhase({
  passage,
  chapterIndex,
  level,
  lines,
  glossary,
  words,
  onContinue,
}: {
  passage: Passage;
  chapterIndex: number;
  level: string;
  lines: PassageLine[];
  /** Surface form → vocabulary entry, resolved on the server. */
  glossary: Record<string, Gloss>;
  /** The passage's deck words, for the rail. */
  words: Gloss[];
  onContinue: () => void;
}) {
  const t = useTranslations("reading.read");
  const tg = useTranslations("reading.genreChip");
  const locale = useLocale();
  const localizedTitle = getLocalizedTitle(passage, locale);
  const genre = passage.genre ?? "";
  const [mode, setMode] = useState<TranslationMode>("tap");
  // Server-rendered at the normal size, then corrected on hydration.
  const large = useSyncExternalStore(subscribeLargeText, readLargeText, () => false);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [speaking, setSpeaking] = useState<number | null>(null);
  // Read inside the speech chain's callbacks, which outlive a render.
  const playing = useRef(false);

  // The audio chain must not keep talking over the quiz.
  useEffect(
    () => () => {
      playing.current = false;
      stopSpeaking();
    },
    []
  );

  function toggleSize() {
    writeLargeText(!large);
  }

  // What to actually speak: the speaker name and the step number are labels,
  // not part of the line.
  const speech = useMemo(
    () =>
      lines.map(({ kr }) => {
        const [speaker, rest] = splitSpeaker(kr);
        const text = (speaker ? rest : kr).replace(/^\d+\.\s*/, "");
        return { text, speaker };
      }),
    [lines]
  );
  // Second speaker gets the other voice, so a dialogue has two people in it.
  const speakers = useMemo(() => {
    const seen: string[] = [];
    for (const { speaker } of speech) {
      if (speaker && !seen.includes(speaker)) seen.push(speaker);
    }
    return seen;
  }, [speech]);

  // Warm the audio cache for the whole passage up front — same voice split
  // playFrom uses — so "Listen" plays each line without a synthesis pause.
  useEffect(() => {
    const byVoice: Record<"f" | "m", string[]> = { f: [], m: [] };
    for (const { text, speaker } of speech) {
      const voice = speaker && speakers.indexOf(speaker) % 2 === 1 ? "m" : "f";
      byVoice[voice].push(text);
    }
    prefetchKorean(byVoice.f, "f");
    prefetchKorean(byVoice.m, "m");
  }, [speech, speakers]);

  // A declaration, not a useCallback: it calls itself to chain the next line.
  function playFrom(index: number) {
    if (!playing.current || index >= speech.length) {
      playing.current = false;
      setSpeaking(null);
      return;
    }
    setSpeaking(index);
    const { text, speaker } = speech[index];
    if (!text.trim()) {
      playFrom(index + 1);
      return;
    }
    speakKorean(text, {
      // The second speaker gets the other voice, so a dialogue has two people.
      pitch: speakers.indexOf(speaker) % 2 === 1 ? 0.85 : 1,
      onend: () => playFrom(index + 1),
      onerror: () => playFrom(index + 1),
    });
  }

  function toggleListen() {
    if (playing.current) {
      playing.current = false;
      stopSpeaking();
      setSpeaking(null);
      return;
    }
    playing.current = true;
    playFrom(speaking ?? 0);
  }

  function toggleLine(i: number) {
    if (mode !== "tap") return;
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const isOpen = (i: number) => mode === "all" || (mode === "tap" && open.has(i));

  const krClass = large ? "text-[19px] leading-[2.05]" : "text-[16.5px] leading-[1.95]";

  // A line and its translation, in that order, in one tap target. Every genre
  // below wraps its own Korean markup in this. Plain functions, not nested
  // components — a component defined during render remounts its whole subtree
  // on every state change, which would drop an open word card mid-hover.
  function revealable(
    index: number,
    children: React.ReactNode,
    { align = "left", enClassName = "" }: { align?: "left" | "right"; enClassName?: string } = {}
  ) {
    const showEn = isOpen(index) && !!lines[index].en;
    const tappable = mode === "tap";
    return (
      <div
        key={index}
        role={tappable ? "button" : undefined}
        tabIndex={tappable ? 0 : undefined}
        aria-expanded={tappable ? open.has(index) : undefined}
        onClick={() => toggleLine(index)}
        onKeyDown={(e) => {
          if (!tappable) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleLine(index);
          }
        }}
        className={`relative rounded-[9px] px-3 py-1.5 -mx-1 transition-colors ${
          tappable ? "cursor-pointer hover:bg-warm" : ""
        } ${speaking === index ? "bg-[var(--tint-sky)]" : ""} ${align === "right" ? "text-right" : ""}`}
      >
        {isOpen(index) && (
          <i
            className="not-italic absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-success"
            aria-hidden="true"
          />
        )}
        {children}
        {showEn && (
          <p className={`text-[13px] text-muted italic leading-[1.6] mt-1 ${enClassName}`}>
            {lines[index].en}
          </p>
        )}
      </div>
    );
  }

  function krLine(index: number, className = "") {
    return (
      <p className={`kr font-medium ${krClass} ${className}`}>
        <GlossedText text={lines[index].kr} glossary={glossary} />
      </p>
    );
  }

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap bg-cream border border-line rounded-[12px] px-2.5 py-2 mb-3.5">
      <span className={`${CHIP} bg-[var(--tint-sky)] border-sky-line text-sky-deep`}>
        {t("chapterN", { n: chapterIndex + 1 })}
      </span>
      {GENRE_ICONS[genre] && (
        <span className={`${CHIP} bg-[var(--tint-amber)] border-amber-line text-amber`}>
          {GENRE_ICONS[genre]} {tg(genre)}
        </span>
      )}
      <span className="text-[12.5px] text-faint">
        {t("meta", {
          level,
          words: countKoreanWords(passage.body_kr),
          min: MINUTES_PER_PASSAGE,
        })}
      </span>
      <span className="flex-1 min-w-1" />
      <button
        type="button"
        onClick={toggleListen}
        aria-pressed={speaking !== null}
        className={`${TOOL_BTN} ${
          speaking !== null
            ? "bg-success-bg border-success text-success-deep"
            : "bg-warm border-line text-muted hover:text-charcoal"
        }`}
      >
        {speaking !== null ? `❚❚ ${t("playing")}` : `▶ ${t("listen")}`}
      </button>
      <button
        type="button"
        onClick={toggleSize}
        aria-pressed={large}
        className={`${TOOL_BTN} ${
          large ? "bg-success-bg border-success text-success-deep" : "bg-warm border-line text-muted hover:text-charcoal"
        }`}
      >
        <span className="kr">가</span> {large ? t("smaller") : t("larger")}
      </button>
      <div className="flex border border-line rounded-[9px] overflow-hidden bg-warm" role="group" aria-label={t("translationLabel")}>
        {(["off", "tap", "all"] as TranslationMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`text-[12px] font-semibold px-2.5 py-1.5 transition-colors border-l border-line first:border-l-0 ${
              mode === m ? "bg-[var(--tint-sky)] text-sky-deep" : "text-muted hover:text-charcoal"
            }`}
          >
            {m === "off" ? t("transOff") : m === "tap" ? t("transTap") : t("transAll")}
          </button>
        ))}
      </div>
    </div>
  );

  const hint = (
    <p className="text-[12.5px] text-faint mt-4 pt-3 border-t border-dashed border-line">
      {mode === "tap" ? t("hintFull") : t("hintDotted")}
    </p>
  );

  // ---------- genre bodies, all single-column ----------
  let body: React.ReactNode;

  if (genre === "dialogue" || genre === "message") {
    body = (
      <div className="grid gap-2.5">
        {lines.map(({ kr }, i) => {
          const [speaker, text] = splitSpeaker(kr);
          const right = speakers.indexOf(speaker) % 2 === 1;
          return revealable(
            i,
            <>
              {speaker && (
                <span className="block text-[11px] font-semibold text-faint mb-1">{speaker}</span>
              )}
              <span
                className={`inline-block max-w-[440px] text-left rounded-[15px] px-4 py-2.5 ${
                  right
                    ? "bg-[var(--tint-sky)] border border-sky-line rounded-tr-[5px]"
                    : "bg-warm border border-line rounded-tl-[5px]"
                }`}
              >
                <span className={`kr block font-medium ${krClass}`}>
                  <GlossedText text={text} glossary={glossary} />
                </span>
              </span>
            </>,
            { align: right ? "right" : "left" }
          );
        })}
      </div>
    );
  } else if (genre === "notice") {
    body = (
      <div className="mx-auto max-w-[560px] -rotate-1 bg-warm border-2 border-dashed border-line rounded-[8px] px-[clamp(18px,4vw,30px)] py-[clamp(22px,4vw,30px)] shadow-[0_2px_10px_rgba(24,20,10,.06)] relative">
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xl drop-shadow-sm" aria-hidden="true">
          📌
        </span>
        <div className="grid gap-1.5">
          {lines.map((_, i) => revealable(i, krLine(i, i === 0 ? "font-bold text-center" : "")))}
        </div>
      </div>
    );
  } else if (genre === "email") {
    body = (
      <div className="rounded-[10px] border border-line overflow-hidden bg-warm">
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[var(--tint-sky)] border-b border-sky-line">
          <span className="text-lg flex-none" aria-hidden="true">
            ✉️
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold text-muted uppercase tracking-[.05em]">{t("subject")}</p>
            <p className="kr font-semibold text-[15px] truncate">{passage.title_kr}</p>
            {mode !== "off" && (
              <p className="text-[12px] text-faint italic truncate">{localizedTitle}</p>
            )}
          </div>
        </div>
        <div className="p-[clamp(16px,3vw,26px)] grid gap-2">
          {lines.map((_, i) => revealable(i, krLine(i)))}
        </div>
      </div>
    );
  } else if (genre === "interview") {
    body = (
      <>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg" aria-hidden="true">
            🎙️
          </span>
          <h2 className="kr text-[16px] font-semibold">{passage.title_kr}</h2>
        </div>
        {mode !== "off" && <p className="text-[13px] text-faint italic mb-4">{localizedTitle}</p>}
        <div className="grid gap-1.5">
          {lines.map(({ kr }, i) => {
            const [speaker, text] = splitSpeaker(kr);
            const isHost = speaker.includes("진행자") || speaker.includes("기자");
            return revealable(
              i,
              <p className={`kr font-medium ${krClass} ${isHost ? "text-muted" : ""}`}>
                {speaker && (
                  <b className={`font-semibold ${isHost ? "text-faint" : "text-sky-deep"}`}>
                    {speaker}:{" "}
                  </b>
                )}
                <GlossedText text={speaker ? text : kr} glossary={glossary} />
              </p>
            );
          })}
        </div>
      </>
    );
  } else if (genre === "instruction") {
    const steps = lines
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => /^\d+\./.test(line.kr.trim()));
    const shown = steps.length > 0 ? steps : lines.map((line, i) => ({ line, i }));
    body = (
      <>
        <h2 className="kr text-[17px] font-semibold mb-1">{passage.title_kr}</h2>
        {mode !== "off" && <p className="text-[13px] text-faint italic mb-4">{localizedTitle}</p>}
        <div className="grid gap-1.5">
          {shown.map(({ line, i }, step) =>
            revealable(
              i,
              <div className="flex items-start gap-3">
                <span className="flex-none w-7 h-7 rounded-full bg-[var(--tint-sky)] border border-sky-line text-sky-deep text-[13px] font-bold flex items-center justify-center">
                  {step + 1}
                </span>
                <p className={`kr font-medium ${krClass} pt-0.5`}>
                  <GlossedText text={line.kr.replace(/^\d+\.\s*/, "")} glossary={glossary} />
                </p>
              </div>,
              { enClassName: "pl-10" }
            )
          )}
        </div>
      </>
    );
  } else if (genre === "review") {
    body = (
      <div className="relative rounded-[10px] border border-amber-line bg-[var(--tint-amber)] px-[clamp(16px,3vw,26px)] py-[clamp(18px,3.2vw,26px)]">
        <span className="absolute -top-3 left-5 bg-cream border border-amber-line rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-amber">
          ⭐ {tg("review")}
        </span>
        <h2 className="kr text-[16px] font-semibold mt-2.5 mb-1">{passage.title_kr}</h2>
        {mode !== "off" && <p className="text-[12.5px] text-faint italic mb-3">{localizedTitle}</p>}
        <div className="grid gap-1">
          {lines.map((_, i) => revealable(i, krLine(i)))}
        </div>
      </div>
    );
  } else {
    body = (
      <>
        <div className="mb-5 pb-4 border-b border-dashed border-line">
          <h2 className="kr text-[20px] font-semibold tracking-[-0.01em]">{passage.title_kr}</h2>
          {mode !== "off" && <p className="text-[13.5px] text-faint italic mt-0.5">{localizedTitle}</p>}
        </div>
        <div className="grid gap-0.5">
          {lines.map((_, i) => revealable(i, krLine(i)))}
        </div>
      </>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_236px] items-start max-w-[1040px]">
      <div className="min-w-0">
        {toolbar}
        <article className="bg-cream border border-line rounded-[14px] px-[clamp(16px,3.4vw,34px)] py-[clamp(18px,3.4vw,30px)]">
          {body}
          {hint}
        </article>
      </div>

      <aside className="grid gap-3 lg:sticky lg:top-4">
        {words.length > 0 && (
          <div className="bg-cream border border-line rounded-[12px] px-3.5 py-3">
            <h3 className="text-[11px] font-semibold tracking-[.08em] uppercase text-faint mb-2">
              {t("wordsTitle")}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {words.slice(0, 14).map((w) => (
                <Link
                  key={w.korean}
                  href={w.href}
                  className="kr text-[13px] font-medium rounded-full px-2.5 py-0.5 bg-warm border border-line text-charcoal hover:border-sky-deep hover:text-sky-deep transition-colors"
                >
                  {w.korean}
                </Link>
              ))}
            </div>
            <p className="text-[11.5px] text-faint mt-2">
              {words.length > 14 ? t("wordsNoteMore", { n: words.length - 14 }) : t("wordsNote")}
            </p>
          </div>
        )}

        <button className={BTN_BLUE} onClick={onContinue}>
          {t("answerQuestions", { n: passage.questions.length })}
        </button>
      </aside>
    </div>
  );
}
