// The three units a freshly placed learner sees on the onboarding result
// card, per route. Built from the real content tables so the links can't rot;
// the client only reorders them by goal (orderForGoal in level-test.ts).
import { GRAMMAR_GROUPS, lessonByKey, lessonsByLevel } from "@/lib/grammar";
import type { FirstLesson, FirstLessonsMap } from "@/lib/level-test";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { MINUTES_PER_SESSION } from "@/lib/vocabulary";

const LISTENING_FIRST: Record<CefrLevel, { key: string; label: string }> = {
  A1: { key: "cafe", label: "At a café · ordering a drink" },
  A2: { key: "restaurant", label: "At a restaurant · asking for the menu" },
  B1: { key: "directions", label: "Finding your way around Seoul" },
  B2: { key: "hotel", label: "Changing a hotel booking" },
  C1: { key: "phone", label: "A phone call at work" },
  C2: { key: "hospital", label: "Explaining symptoms at a clinic" },
};

function grammarFirst(level: CefrLevel): FirstLesson {
  const key = level === "A1" ? GRAMMAR_GROUPS[0].lessonKeys[0] : lessonsByLevel(level)[0]?.key;
  const lesson = key ? lessonByKey(key) : undefined;
  return {
    href: lesson ? `/grammar/${lesson.key}` : "/grammar",
    label: lesson ? `${lesson.title} · ${lesson.krTitle}` : "Grammar · first lesson",
    skill: "grammar",
    minutes: 6,
  };
}

function wordsFirst(level: CefrLevel): FirstLesson {
  return {
    href: `/vocabulary/daily-life/session?level=${level}&chapter=0`,
    label: "Daily life words · set 1",
    skill: "words",
    minutes: MINUTES_PER_SESSION,
  };
}

function listeningFirst(level: CefrLevel): FirstLesson {
  const s = LISTENING_FIRST[level];
  return { href: `/listening/${s.key}?level=${level}`, label: s.label, skill: "listening", minutes: 5 };
}

export function buildFirstLessons(): FirstLessonsMap {
  const map = {} as FirstLessonsMap;
  for (const level of LEVEL_ORDER) {
    map[level] = [grammarFirst(level), wordsFirst(level), listeningFirst(level)];
  }
  map.hangul = [
    { href: "/hangul", label: "Hangul · read your first syllables", skill: "hangul", minutes: 6 },
    grammarFirst("A1"),
    wordsFirst("A1"),
  ];
  return map;
}
