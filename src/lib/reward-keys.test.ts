import { describe, expect, it } from "vitest";
import {
  challengeKey,
  grammarLessonKey,
  listeningDialogueKey,
  pronunciationChapterKey,
  readingPassageKey,
  reviewSessionKey,
  vocabChapterKey,
  writingChapterKey,
} from "@/lib/reward-keys";

// These strings are the primary key of a payment (public.reward_grants, see
// migration 0063). Two chapters sharing a key means one of them silently
// never pays; a key that changes shape between releases means every chapter
// pays a second time. Both failures are invisible in the UI, so they're
// pinned here.

describe("reward keys", () => {
  it("are stable strings, not derived from anything that can drift", () => {
    expect(writingChapterKey("A1", 0)).toBe("writing:A1:0");
    expect(readingPassageKey("a1-market")).toBe("reading:a1-market");
    expect(grammarLessonKey("a1-topic-marker")).toBe("grammar:a1-topic-marker");
    expect(pronunciationChapterKey("rieul")).toBe("pronunciation:rieul");
    expect(challengeKey("tongue-twister-1")).toBe("challenge:tongue-twister-1");
    expect(vocabChapterKey("food", 2)).toBe("vocab:food:2");
    expect(listeningDialogueKey("cafe-order")).toBe("listening:cafe-order");
    expect(reviewSessionKey).toBe("review");
  });

  it("keeps every skill in its own namespace", () => {
    // The same underlying id in two skills must not collide — clearing
    // reading chapter 1 must not mark writing chapter 1 as paid.
    const keys = [
      writingChapterKey("A1", 1),
      readingPassageKey("A1:1"),
      grammarLessonKey("A1:1"),
      pronunciationChapterKey("A1:1"),
      challengeKey("A1:1"),
      vocabChapterKey("A1", 1),
      listeningDialogueKey("A1:1"),
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("separates chapters within a skill", () => {
    expect(writingChapterKey("A1", 0)).not.toBe(writingChapterKey("A1", 1));
    expect(writingChapterKey("A1", 0)).not.toBe(writingChapterKey("A2", 0));
    expect(vocabChapterKey("food", 1)).not.toBe(vocabChapterKey("travel", 1));
  });

  it("does not let a chapter index run into the topic name", () => {
    // "vocab:a:11" vs "vocab:a1:1" — a delimiter-less key would make these
    // the same string and pay only one of the two chapters.
    expect(vocabChapterKey("a", 11)).not.toBe(vocabChapterKey("a1", 1));
    expect(writingChapterKey("A1", 11)).not.toBe(writingChapterKey("A11", 1));
  });
});
