import { describe, expect, it } from "vitest";
import type { Prompt } from "./writing";
import { buildBoard, checkTiles, localScore, tilesText, wrongTilePositions } from "./writing-builder";

const p = (over: Partial<Prompt>): Prompt => ({
  key: "writing:A1:x",
  level: "A1",
  genre: "journal",
  prompt_kr: "오늘 아침을 먹었어요?",
  prompt_en: "Did you eat breakfast?",
  example_kr: "저는 아침에 빵을 먹었어요.",
  example_en: "I ate bread this morning.",
  ...over,
});

const siblings: Prompt[] = [
  p({ key: "s1", example_kr: "저는 어제 텔레비전을 봤어요." }),
  p({ key: "s2", example_kr: "오늘 날씨가 추워요." }),
  p({ key: "s3", example_kr: "저는 학교에 가요." }),
];

describe("buildBoard", () => {
  const board = buildBoard(p({}), siblings.flatMap((s) => s.example_kr.split(" ")), 7);

  it("keeps every answer word and adds distractors that aren't in the answer, within the A-tier budget of 6", () => {
    expect(board.answer).toEqual(["저는", "아침에", "빵을", "먹었어요."]);
    expect(board.tiles.length).toBe(6); // 4-word answer + 2 distractors (A1/A2 budget is 6 tiles total)
    const texts = board.tiles.map((t) => t.text);
    for (const w of board.answer) expect(texts).toContain(w);
    const extras = texts.filter((t) => !board.answer.includes(t));
    expect(extras.length).toBe(2);
    for (const e of extras) expect(board.answer).not.toContain(e);
  });

  it("is deterministic for a seed and different for another", () => {
    const again = buildBoard(p({}), siblings.flatMap((s) => s.example_kr.split(" ")), 7);
    expect(again.tiles).toEqual(board.tiles);
    const other = buildBoard(p({}), siblings.flatMap((s) => s.example_kr.split(" ")), 8);
    expect(other.tiles.map((t) => t.text)).not.toEqual(board.tiles.map((t) => t.text));
  });

  it("checks order and reports wrong positions", () => {
    const idFor = (w: string) => board.tiles.find((t) => t.text === w)!.id;
    const right = board.answer.map(idFor);
    expect(checkTiles(board, right)).toBe(true);
    expect(tilesText(board, right)).toBe(p({}).example_kr);
    const swapped = right.slice();
    [swapped[1], swapped[2]] = [swapped[2], swapped[1]];
    expect(checkTiles(board, swapped)).toBe(false);
    expect(wrongTilePositions(board, swapped)).toEqual([1, 2]);
    expect(checkTiles(board, right.slice(0, -1))).toBe(false);
  });

  // 2026-09-11 (user: "A는 3~6개, B는 6~8개, C는 8~10개면 될거같은데"): the
  // total tile budget scales by CEFR tier, and a sentence longer than its
  // tier's budget gets grouped into multi-word tiles rather than one tile
  // per word.
  it("adds at most 2 distractors for a short A-tier sentence, never filling the budget past that", () => {
    const short = p({ level: "A2", example_kr: "저는 밥을 먹어요." }); // 3 words
    const b = buildBoard(short, siblings.flatMap((s) => s.example_kr.split(" ")), 1);
    expect(b.answer).toEqual(["저는", "밥을", "먹어요."]);
    expect(b.tiles.length).toBe(5); // 3-word answer + 2 distractors (the max-2 rule wins here, under the 6-tile budget)
  });

  it("stays within the B-tier budget of 8, no grouping needed under it", () => {
    const b1 = p({ level: "B1", example_kr: "저는 어제 친구랑 바다에 가서 고기를 먹었어요." }); // 7 words
    const b = buildBoard(b1, siblings.flatMap((s) => s.example_kr.split(" ")), 1);
    expect(b.answer.length).toBe(7); // fits under the 8-tile B budget as-is
    expect(b.tiles.length).toBe(8);
  });

  it("groups a sentence longer than its tier's budget into multi-word tiles", () => {
    // 9 words at A-tier (budget 6) — well past the point a single-word-per-tile board would fit.
    const long = p({
      level: "A2",
      example_kr: "저는 어제 친구랑 바다에 가서 고기를 먹었어요 정말 좋았어요.",
    });
    const b = buildBoard(long, siblings.flatMap((s) => s.example_kr.split(" ")), 1);
    expect(b.answer.length).toBe(6); // grouped down to the A-tier cap
    expect(b.tiles.length).toBe(6); // no room left for distractors
    // grouping never drops or reorders a word — joining the tiles back
    // reproduces the original sentence exactly.
    expect(b.answer.join(" ")).toBe(long.example_kr);
  });

  it("caps a C-tier sentence at 10 tiles even for a 16-word answer", () => {
    const c2 = p({
      level: "C2",
      example_kr: "저는 지난주에 부모님과 통화해서 오랜만에 만난 친구와 함께 저녁을 먹고 영화를 보고 카페에 가서 이야기를 나눴어요.",
    });
    const b = buildBoard(c2, siblings.flatMap((s) => s.example_kr.split(" ")), 1);
    expect(b.answer.length).toBeLessThanOrEqual(10);
    expect(b.tiles.length).toBeLessThanOrEqual(10);
    expect(b.answer.join(" ")).toBe(c2.example_kr);
  });
});

describe("localScore", () => {
  it("rewards the first try and floors at 60", () => {
    expect(localScore(1)).toBe(100);
    expect(localScore(2)).toBe(85);
    expect(localScore(9)).toBe(60);
  });
});
