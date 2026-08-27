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

/**
 * Up to `limit` real sentences containing `korean`, drawn from reading
 * passages and listening dialogues (interleaved), excluding `excludeKr`
 * (the word's own hand-authored example) and any exact-duplicate sentence.
 */
export function findMoreExamples(korean: string, excludeKr: string, limit = 2): MoreExample[] {
  const seen = new Set([excludeKr.trim()]);
  const out: MoreExample[] = [];

  const reading = allReadingLines().filter((l) => l.kr.includes(korean));
  const listening = allListeningLines().filter((l) => l.kr.includes(korean));

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
