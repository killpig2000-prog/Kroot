import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { getChaptersForTopic, type VocabWord } from "@/lib/vocabulary";
import { getLocalizedMeaning } from "@/lib/vocabulary-i18n";
import { surfaceCandidates, tokenizeKorean } from "@/lib/word-bank";

// Links a Korean word found in reading text to its entry on the vocabulary
// page. The word page is addressed positionally
// (/vocabulary/daily-life/word?level=&chapter=&i=), so getting there from a
// word needs the reverse of getChaptersForTopic() — the index built below.
//
// SERVER ONLY: this pulls the whole 4k-word deck in statically. Import the
// `Gloss` *type* from a client component if you need it (type imports are
// erased); never import the functions.

const TOPIC_KEY = "daily-life";

export type Gloss = {
  /** Dictionary form, which may differ from the surface form in the text. */
  korean: string;
  romanization: string;
  meaning: string;
  level: CefrLevel;
  /** "Unit 7" — where the word sits on the vocabulary page. */
  unitLabel: string;
  href: string;
};

type Entry = { word: VocabWord; level: CefrLevel; chapter: number; index: number };

let formIndex: Map<string, Entry> | null = null;

/** surface form → its coordinates on the vocabulary page. Built once. */
function getIndex(): Map<string, Entry> {
  if (formIndex) return formIndex;
  const map = new Map<string, Entry>();
  // Lower levels are indexed first so the easier entry wins when the same
  // surface form appears at two levels — mirrors word-bank's own dictionary.
  for (const level of LEVEL_ORDER) {
    const chapters = getChaptersForTopic(TOPIC_KEY, level);
    chapters.forEach((words, chapter) => {
      words.forEach((word, index) => {
        // Entries like "안녕/안녕하세요" index each alternative.
        for (const form of word.korean.split("/")) {
          const k = form.trim();
          if (k && !map.has(k)) map.set(k, { word, level, chapter, index });
        }
      });
    });
  }
  formIndex = map;
  return map;
}

function isInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

function hrefFor(entry: Entry, backHref?: string): string {
  const base = `/vocabulary/${TOPIC_KEY}/word?level=${entry.level}&chapter=${entry.chapter}&i=${entry.index}`;
  if (!backHref || !isInternalPath(backHref)) return base;
  return `${base}&from=reading&back=${encodeURIComponent(backHref)}`;
}

/** Resolve one surface token, or null when it isn't in the deck. */
export function glossFor(token: string, locale: string, backHref?: string): Gloss | null {
  const index = getIndex();
  for (const candidate of surfaceCandidates(token)) {
    const entry = index.get(candidate);
    if (!entry) continue;
    return {
      korean: entry.word.korean,
      romanization: entry.word.romanization,
      meaning: getLocalizedMeaning(entry.word, locale),
      level: entry.level,
      unitLabel: `Unit ${entry.chapter + 1}`,
      href: hrefFor(entry, backHref),
    };
  }
  return null;
}

/**
 * Every word of `text` that has a vocabulary entry, keyed by the surface form
 * exactly as it appears — so the reader can look a token up synchronously
 * while rendering, with no dictionary in the client bundle.
 */
export function buildGlossary(
  text: string,
  locale: string,
  backHref?: string
): Record<string, Gloss> {
  const out: Record<string, Gloss> = {};
  for (const token of tokenizeKorean(text)) {
    if (!token.isWord || out[token.text]) continue;
    const gloss = glossFor(token.text, locale, backHref);
    if (gloss) out[token.text] = gloss;
  }
  return out;
}

/** The deck words in a passage, one entry per dictionary form, in text order. */
export function glossaryWords(glossary: Record<string, Gloss>): Gloss[] {
  const seen = new Set<string>();
  const out: Gloss[] = [];
  for (const gloss of Object.values(glossary)) {
    if (seen.has(gloss.korean)) continue;
    seen.add(gloss.korean);
    out.push(gloss);
  }
  return out;
}
