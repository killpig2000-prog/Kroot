import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";
import type { RawVocabWord } from "@/lib/vocabulary-data/types";
import { DAILY_LIFE_WORDS } from "@/lib/vocabulary-data/daily-life";

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

const TOPIC_WORD_SOURCES: Record<string, RawVocabWord[]> = {
  "daily-life": DAILY_LIFE_WORDS,
};

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
};

export function getWordsForTopic(topicKey: string, level?: CefrLevel): VocabWord[] {
  const raw = TOPIC_WORD_SOURCES[topicKey] ?? [];
  return raw
    .filter((w) => !level || w.level === level)
    .map((w) => ({ ...w, topic_key: topicKey, key: `${topicKey}:${w.level}:${w.korean}` }));
}

// Display metadata for each unit (= chapter) of the daily-life track, curated
// to match the words that actually land in that slice. Falls back to "Unit N".
const UNIT_TITLES: Record<string, string[]> = {
  A1: ["First words", "People & time", "Around the house", "Home objects"],
  A2: ["Plans & weather", "Getting around", "Around town", "Free time"],
  B1: ["Life & habits", "People & feelings", "Mind & mood", "Goals & mistakes"],
  B2: ["Getting along", "Character traits", "Working together", "Life balance"],
  C1: ["Critical thinking", "Argument & logic", "Public discourse", "Open minds"],
  C2: ["Idioms of fate", "Idioms of effort", "Hard moments", "Mastery"],
};

export const UNIT_ICONS: { icon: string; bg: string }[] = [
  { icon: "💬", bg: "#F0FDF4" },
  { icon: "🧭", bg: "#EFF6FF" },
  { icon: "🌿", bg: "#F5F3FF" },
  { icon: "🎯", bg: "#FFFBEB" },
  { icon: "📚", bg: "#FDF2F8" },
  { icon: "⭐", bg: "#F0FDFA" },
];

export function getUnitTitle(level: CefrLevel, index: number): string {
  return UNIT_TITLES[level]?.[index] ?? `Unit ${index + 1}`;
}

export const CHAPTER_SIZE = 5;
export const MINUTES_PER_SESSION = 5;
export const QUIZ_OPTION_COUNT = 4;

// Splits a level's word list into fixed, deterministically-ordered chapters —
// short enough to clear in a couple of minutes, so leveling up feels frequent.
export function getChaptersForTopic(topicKey: string, level: CefrLevel): VocabWord[][] {
  const words = getWordsForTopic(topicKey, level);
  const chapters: VocabWord[][] = [];
  for (let i = 0; i < words.length; i += CHAPTER_SIZE) {
    chapters.push(words.slice(i, i + CHAPTER_SIZE));
  }
  return chapters;
}

// A vocabulary difficulty tier opens once every unit of the previous tier is
// finished AND the XP level floor is met — unless the level test already placed
// the user at/above it.
export function unlockedVocabTiers(
  topicKey: string,
  reviewedKeys: Set<string>,
  myLevel: CefrLevel,
  playerLevel: number
): Set<CefrLevel> {
  const tierComplete = (lv: CefrLevel) =>
    getChaptersForTopic(topicKey, lv).every((unit) => unit.every((w) => reviewedKeys.has(w.key)));

  const unlocked = new Set<CefrLevel>();
  for (let i = 0; i < LEVEL_ORDER.length; i++) {
    const lv = LEVEL_ORDER[i];
    if (i === 0 || i <= LEVEL_ORDER.indexOf(myLevel)) {
      unlocked.add(lv);
      continue;
    }
    const prev = LEVEL_ORDER[i - 1];
    if (unlocked.has(prev) && tierComplete(prev) && isDifficultyUnlocked(lv, playerLevel, myLevel)) {
      unlocked.add(lv);
    }
  }
  return unlocked;
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

// Pure (no Math.random side effects at import/render time) — call this from an
// event handler, not during render, per the impure-during-render lint rule.
export function buildQuizQuestions(words: VocabWord[]): QuizQuestion[] {
  if (words.length === 0) return [];
  const mode = quizModeForLevel(words[0].level);

  return words
    .filter((w) => mode === "meaning" || w.example_kr)
    .map((word) => {
      const distractorPool = words.filter((w) => w.key !== word.key && w.korean !== word.korean);
      const shuffled = [...distractorPool].sort(() => Math.random() - 0.5);
      const distractors = shuffled.slice(0, QUIZ_OPTION_COUNT - 1);

      const correctAnswer = mode === "meaning" ? word.meaning_en : word.korean;
      const distractorValues =
        mode === "meaning" ? distractors.map((d) => d.meaning_en) : distractors.map((d) => d.korean);
      const options = [correctAnswer, ...distractorValues].sort(() => Math.random() - 0.5);

      const prompt = mode === "meaning" ? word.korean : blankOutWord(word.example_kr, word.korean);
      return { word, mode, prompt, options };
    });
}
