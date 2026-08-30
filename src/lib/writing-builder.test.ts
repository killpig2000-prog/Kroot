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

  it("keeps every answer word and adds a couple distractors that aren't in the answer", () => {
    expect(board.answer).toEqual(["저는", "아침에", "빵을", "먹었어요."]);
    expect(board.tiles.length).toBe(board.answer.length + 1);
    const texts = board.tiles.map((t) => t.text);
    for (const w of board.answer) expect(texts).toContain(w);
    const extras = texts.filter((t) => !board.answer.includes(t));
    expect(extras.length).toBe(1);
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

  it("uses only 1 distractor for a very short answer", () => {
    const short = p({ example_kr: "저는 밥을 먹어요." });
    const b = buildBoard(short, siblings.flatMap((s) => s.example_kr.split(" ")), 1);
    expect(b.tiles.length).toBe(b.answer.length + 1);
  });

  it("scales up to 3 distractors for a longer answer", () => {
    const long = p({ example_kr: "저는 어제 친구랑 바다에 가서 고기를 먹었어요." });
    const b = buildBoard(long, siblings.flatMap((s) => s.example_kr.split(" ")), 1);
    expect(b.tiles.length).toBe(b.answer.length + 3);
  });
});

describe("localScore", () => {
  it("rewards the first try and floors at 60", () => {
    expect(localScore(1)).toBe(100);
    expect(localScore(2)).toBe(85);
    expect(localScore(9)).toBe(60);
  });
});
