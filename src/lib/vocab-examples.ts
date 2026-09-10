// Finds real sentences from elsewhere in the app (reading passages,
// listening dialogues) that actually contain a given word — so a vocab
// card can show 2-3 examples of the word "in the wild" instead of just the
// one hand-authored sentence. Server-only: the reading/listening corpora
// are large, so this must never be imported into a "use client" component.
import { DIALOGUES } from "@/lib/listening-dialogues";
import { DAILY_LIFE_PASSAGES } from "@/lib/reading-data/daily-life";

export type MoreExample = { kr: string; en: string; source: "reading" | "listening" };

// Same split rule ReadingSession.tsx uses to pair Korean/English lines —
// structured genres (dialogue/message/notice/email/instruction/interview)
// split on newlines, everything else splits sentence-by-sentence.
const STRUCTURED_GENRES = new Set(["dialogue", "message", "notice", "email", "instruction", "interview"]);
const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

function splitLines(body: string, structured: boolean): string[] {
  return (structured ? body.split("\n") : body.split(SENTENCE_SPLIT)).filter(Boolean);
}

let readingIndex: MoreExample[] | null = null;
function allReadingLines(): MoreExample[] {
  if (readingIndex) return readingIndex;
  const out: MoreExample[] = [];
  for (const p of DAILY_LIFE_PASSAGES) {
    const structured = STRUCTURED_GENRES.has(p.genre ?? "");
    const krLines = splitLines(p.body_kr, structured);
    const enLines = splitLines(p.body_en, structured);
    if (krLines.length !== enLines.length) continue; // misaligned — skip this passage
    for (let i = 0; i < krLines.length; i++) {
      out.push({ kr: krLines[i].trim(), en: enLines[i].trim(), source: "reading" });
    }
  }
  readingIndex = out;
  return out;
}

let listeningIndex: MoreExample[] | null = null;
function allListeningLines(): MoreExample[] {
  if (listeningIndex) return listeningIndex;
  listeningIndex = DIALOGUES.flatMap((d) =>
    d.lines.map((l) => ({ kr: l.kr.trim(), en: l.en.trim(), source: "listening" as const }))
  );
  return listeningIndex;
}

const HANGUL = /[가-힣]/;

// Korean particles that may follow a noun. Anything else glued to the word
// means it's a different word.
const PARTICLES = new Set([
  "은", "는", "이", "가", "을", "를", "의", "도", "만", "과", "와", "랑", "이랑",
  "에", "에서", "에게", "에겐", "께", "께서", "한테", "한테서", "으로", "로",
  "까지", "부터", "보다", "처럼", "마다", "밖에", "조차", "마저", "이나", "나",
  "라도", "이라도", "라고", "이라고", "야", "이야", "요", "이다", "입니다",
  "예요", "이에요", "이었어요", "였어요",
]);

/**
 * Whether `line` really uses `word` — as opposed to merely containing its
 * letters inside a longer word. Plain `includes` offered 물 the sentence
 * "건물 지하에 있고…" (building), which read as a wrong example the moment
 * the source label came off the card (2026-09-08).
 *
 * A hit counts when nothing Hangul sits immediately before the word, and
 * what runs on after it is either nothing or one of the particles a noun
 * takes. Words that only ever appear conjugated (verbs, adjectives) simply
 * find no second sentence, which is the right answer — the card shows one
 * example rather than a wrong one.
 */
function hasWord(line: string, word: string): boolean {
  for (let i = line.indexOf(word); i !== -1; i = line.indexOf(word, i + 1)) {
    const before = line[i - 1];
    if (before && HANGUL.test(before)) continue;
    const tail = /^[가-힣]*/.exec(line.slice(i + word.length))![0];
    if (tail === "" || PARTICLES.has(tail)) return true;
  }
  return false;
}

/**
 * Up to `limit` real sentences containing `korean`, drawn from reading
 * passages and listening dialogues (interleaved), excluding `excludeKr`
 * (the word's own hand-authored example) and any exact-duplicate sentence.
 */
// A card shows this sentence on one line (2026-09-11, user call), so a
// corpus line long enough to wrap isn't "shortest available" — it's the
// wrong example. ~22 characters is what a 360px phone's card fits at the
// example's font size without wrapping (measured against the narrowest
// AGENTS.md reference width), generous enough that most short corpus
// sentences still qualify.
const MAX_KR_LEN = 22;

export function findMoreExamples(korean: string, excludeKr: string, limit = 2): MoreExample[] {
  const seen = new Set([excludeKr.trim()]);
  const out: MoreExample[] = [];

  // Shortest first, and never longer than one line. The corpus is written
  // for reading and listening practice, so a word like 물 can turn up in a
  // B-level sentence about coffee grind size — true, but not a second
  // example an A1 learner can use. Length is the cheap stand-in for
  // "simple enough to read twice".
  const byLength = (a: MoreExample, b: MoreExample) => a.kr.length - b.kr.length;
  const fits = (l: MoreExample) => l.kr.length <= MAX_KR_LEN;
  const reading = allReadingLines().filter((l) => hasWord(l.kr, korean) && fits(l)).sort(byLength);
  const listening = allListeningLines().filter((l) => hasWord(l.kr, korean) && fits(l)).sort(byLength);

  // Interleave so a word doesn't end up all-reading or all-listening.
  const max = Math.max(reading.length, listening.length);
  for (let i = 0; i < max && out.length < limit; i++) {
    for (const line of [listening[i], reading[i]]) {
      if (!line || out.length >= limit) continue;
      if (seen.has(line.kr)) continue;
      seen.add(line.kr);
      out.push(line);
    }
  }
  return out;
}
