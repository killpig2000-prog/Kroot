import { describe, expect, it } from "vitest";
import { buildGlossary, glossaryWords, glossFor } from "@/lib/word-links";
import { findEvidenceLine, getChaptersForLevel, splitPassageLines } from "@/lib/reading";

describe("glossFor", () => {
  it("resolves a conjugated surface form to its dictionary entry", () => {
    const gloss = glossFor("우산을", "en");
    expect(gloss?.korean).toBe("우산");
    expect(gloss?.href).toContain("/vocabulary/daily-life/word?level=");
    expect(gloss?.href).toMatch(/chapter=\d+&i=\d+/);
  });

  it("returns null for a word that isn't in the deck", () => {
    expect(glossFor("괴발개발", "en")).toBeNull();
  });

  it("carries an internal return address, and only an internal one", () => {
    const ok = glossFor("우산", "en", "/reading/session?chapter=2&level=A1");
    expect(ok?.href).toContain("from=reading&back=%2Freading%2Fsession");
    expect(glossFor("우산", "en", "https://evil.example/x")?.href).not.toContain("back=");
    expect(glossFor("우산", "en", "//evil.example/x")?.href).not.toContain("back=");
  });
});

describe("buildGlossary", () => {
  it("finds deck words in a real A1 passage", () => {
    const passage = getChaptersForLevel("A1")[0][0];
    const glossary = buildGlossary(passage.body_kr, "en");
    const words = glossaryWords(glossary);
    expect(words.length).toBeGreaterThan(0);
    // Keyed by the surface form as it appears, so rendering can look up
    // tokens without normalizing again.
    for (const [surface, gloss] of Object.entries(glossary)) {
      expect(passage.body_kr).toContain(surface);
      expect(gloss.meaning.length).toBeGreaterThan(0);
    }
  });
});

describe("findEvidenceLine", () => {
  it("points at the line the answer came from", () => {
    const lines = [
      { kr: "비가 왔어요.", en: "It rained." },
      { kr: "저는 딸기를 한 상자 샀어요.", en: "I bought a box of strawberries." },
      { kr: "시장은 조용했어요.", en: "The market was quiet." },
    ];
    const index = findEvidenceLine(lines, {
      question_en: "What did the writer buy?",
      options: ["An umbrella", "A box of strawberries", "Nothing", "Apples"],
      answerIndex: 1,
    });
    expect(index).toBe(1);
  });

  it("returns null rather than guessing when nothing matches", () => {
    const lines = [{ kr: "비가 왔어요.", en: "It rained." }];
    expect(
      findEvidenceLine(lines, {
        question_en: "How does the writer feel?",
        options: ["Happy", "Bored", "Angry", "Tired"],
        answerIndex: 3,
      })
    ).toBeNull();
  });

  it("finds evidence for most questions across a level's passages", () => {
    const chapters = getChaptersForLevel("A1");
    let total = 0;
    let found = 0;
    for (const [passage] of chapters) {
      const lines = splitPassageLines(passage);
      for (const question of passage.questions) {
        total += 1;
        if (findEvidenceLine(lines, question) !== null) found += 1;
      }
    }
    expect(total).toBeGreaterThan(0);
    // A heuristic, not authored data — it may abstain, but it shouldn't be
    // abstaining most of the time.
    expect(found / total).toBeGreaterThan(0.5);
  });
});
