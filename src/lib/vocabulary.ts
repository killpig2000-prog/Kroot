// Pure logic and types only. The word data itself — and the ~1 MB of example
// overrides that come with it — lives in `lib/vocabulary-words`, so that a
// client component importing a helper from here doesn't pull the deck into
// its bundle. Server callers wanting words import that module directly.
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";
import type { RawVocabWord } from "@/lib/vocabulary-data/types";

export type VocabTopic = {
  key: string;
  label: string;
  krLabel: string;
  icon: string;
  bg: string;
  color: string;
  available: boolean;
};

// Only "daily-life" has words yet — the rest are shown as a preview of what's
// coming so the topic picker doesn't feel like a dead end.
export const VOCAB_TOPICS: VocabTopic[] = [
  { key: "daily-life", label: "Daily life", krLabel: "일상생활", icon: "☕", bg: "#FFD66B", color: "#7A5A12", available: true },
  { key: "food", label: "Food", krLabel: "음식", icon: "🍜", bg: "#FF9E7D", color: "#fff", available: false },
  { key: "travel", label: "Travel", krLabel: "여행", icon: "✈️", bg: "#8FCBDF", color: "#fff", available: false },
  { key: "business", label: "Business", krLabel: "비즈니스", icon: "💼", bg: "#B7A6E3", color: "#fff", available: false },
  { key: "sports", label: "Sports", krLabel: "스포츠", icon: "⚽", bg: "#7FB8A4", color: "#fff", available: false },
];

// Shared Sino-Korean roots — surfaced as a "bonus root" panel on cards whose
// word carries the matching `root` key.
export type VocabRoot = {
  syllable: string;
  name: string;
  desc: string;
  words: [korean: string, meaning: string][];
};

export const VOCAB_ROOTS: Record<string, VocabRoot> = {
  gam: {
    syllable: "감",
    name: "“감” — feeling / sense",
    desc: "Shows up across words about feelings and inner senses",
    words: [
      ["감정", "emotion"],
      ["자신감", "confidence"],
      ["공감", "empathy"],
      ["책임감", "sense of responsibility"],
    ],
  },
  pyeon: {
    syllable: "편",
    name: "“편” — leaning / one-sided",
    desc: "The base for words about slanted or narrow views",
    words: [
      ["편견", "prejudice"],
      ["편향", "bias"],
      ["편협함", "narrow-mindedness"],
    ],
  },
  ryeok: {
    syllable: "력",
    name: "“력” — power / ability",
    desc: "A suffix that turns a quality into an ability",
    words: [
      ["통찰력", "insight"],
      ["포용력", "inclusiveness"],
      ["협력", "cooperation"],
      ["저력", "latent strength"],
    ],
  },
};

export type VocabWord = RawVocabWord & {
  // Stable id independent of any database row — used both as the flashcard
  // React key and as vocabulary_progress.word_key.
  key: string;
  topic_key: string;
};

export type VocabWordWithProgress = VocabWord & {
  correct_count: number;
  incorrect_count: number;
  last_reviewed_at: string | null;
  // Leitner box (1-5); missing until migration 0022 / first review.
  box?: number | null;
  // 0-2 more real sentences containing this word, found elsewhere in the
  // app (reading/listening) — see lib/vocab-examples.ts. Populated by the
  // session page (server-side); optional so other callers keep compiling.
  moreExamples?: { kr: string; en: string; source: "reading" | "listening" }[];
};

// Units are plainly numbered ("Unit 7") — no curated titles. What a unit is
// about is shown by its words, not a label. Five units make one chapter.
//
// The unitLabel() helper that used to live here is gone: it hardcoded an
// English "Unit N", and every caller now formats the number through the
// `vocabulary.unitN` message instead, so it localizes.
export const CHAPTER_UNITS = 5;

export const CHAPTER_SIZE = 10;
export const MINUTES_PER_SESSION = 8;
export const QUIZ_OPTION_COUNT = 4;

// Tiers at/below the tested CEFR level are open; anything above requires a
// promotion test — finishing the words alone never unlocks harder content.
export function unlockedVocabTiers(myLevel: CefrLevel): Set<CefrLevel> {
  return new Set(LEVEL_ORDER.filter((lv) => isDifficultyUnlocked(lv, myLevel)));
}

export type ChapterStatus = "done" | "current" | "locked";

// A chapter is "done" once every word in it has been reviewed at least once.
// Chapter N is only playable ("current") once chapter N-1 is done — everything
// after stays locked, which is what gives completing one its level-up feel.
export function getChapterStatuses(
  chapters: VocabWord[][],
  reviewedKeys: Set<string>
): ChapterStatus[] {
  const statuses: ChapterStatus[] = [];
  let previousDone = true;
  for (const chapter of chapters) {
    const done = chapter.length > 0 && chapter.every((w) => reviewedKeys.has(w.key));
    statuses.push(done ? "done" : previousDone ? "current" : "locked");
    previousDone = done;
  }
  return statuses;
}

// Words never reviewed, or with more misses than hits, come first — a light
// "keep the tricky ones" pass rather than a full spaced-repetition scheduler.
export function sortForReview(words: VocabWordWithProgress[]): VocabWordWithProgress[] {
  return [...words].sort((a, b) => {
    const aTricky = a.incorrect_count - a.correct_count;
    const bTricky = b.incorrect_count - b.correct_count;
    if (aTricky !== bTricky) return bTricky - aTricky;
    const aSeen = a.last_reviewed_at ? 1 : 0;
    const bSeen = b.last_reviewed_at ? 1 : 0;
    return aSeen - bSeen;
  });
}

// Replaces the first occurrence of `word` inside `sentence` with a blank —
// works fine even when a particle is attached (e.g. "물이에요" -> "_____이에요").
export function blankOutWord(sentence: string, word: string): string {
  const idx = sentence.indexOf(word);
  if (idx === -1) return sentence;
  return `${sentence.slice(0, idx)}_____${sentence.slice(idx + word.length)}`;
}

// A1/A2 learners don't know sentence structure yet, so a fill-in-the-blank
// sentence is unfair — they just match the isolated word to its meaning.
// B1+ have enough grammar to use the word-in-context quiz.
export type QuizMode = "meaning" | "blank";

export function quizModeForLevel(level: CefrLevel): QuizMode {
  return level === "A1" || level === "A2" ? "meaning" : "blank";
}

export type QuizQuestion = {
  word: VocabWord;
  mode: QuizMode;
  prompt: string;
  options: string[];
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates. `sort(() => rand() - 0.5)` is not a shuffle: it biases the
// result and, with a seeded rand, the comparator's call order is not even
// stable across engines.
function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Derives a stable seed from the words themselves, so the server and the
// client independently arrive at the same order.
export function seedFromWords(words: { key: string }[]): number {
  let seed = 0;
  for (const w of words) for (const ch of w.key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
  return seed;
}

// Deterministic when given a seed. ReviewSession builds its questions during
// render (both on the server and again while hydrating), so an unseeded
// Math.random shuffle made the two disagree and React threw the whole tree
// away — the answer buttons visibly reordered under the user's finger.
export function buildQuizQuestions(
  words: VocabWord[],
  seed?: number,
  // Where the wrong answers come from. A review session can be as short as one
  // due word, and drawing only from the session left a "quiz" with a single
  // option — the answer, alone. Callers that can afford a wider pool (the
  // review page picks same-level words server-side) pass one.
  pool: VocabWord[] = words,
): QuizQuestion[] {
  if (words.length === 0) return [];
  const rand = seed === undefined ? Math.random : mulberry32(seed);

  return words
    // The mode follows each word's own level: /review mixes levels, and taking
    // it from words[0] asked an A1 learner to fill a C1 blank and vice versa.
    .map((word) => ({ word, mode: quizModeForLevel(word.level) }))
    .filter(({ word, mode }) => mode === "meaning" || word.example_kr)
    .map(({ word, mode }) => {
      const distractorPool = (pool.length > words.length ? pool : words).filter(
        (w) => w.key !== word.key && w.korean !== word.korean && w.level === word.level,
      );
      const shuffled = shuffle(distractorPool, rand);
      const distractors = shuffled.slice(0, QUIZ_OPTION_COUNT - 1);

      const correctAnswer = mode === "meaning" ? word.meaning_en : word.korean;
      const distractorValues =
        mode === "meaning" ? distractors.map((d) => d.meaning_en) : distractors.map((d) => d.korean);
      const options = shuffle([correctAnswer, ...distractorValues], rand);

      const prompt = mode === "meaning" ? word.korean : blankOutWord(word.example_kr, word.korean);
      return { word, mode, prompt, options };
    });
}
