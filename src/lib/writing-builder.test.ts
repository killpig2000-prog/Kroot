import { describe, expect, it } from "vitest";
import type { Prompt } from "./writing";
import {
  buildBoard,
  buildChunks,
  buildSlots,
  buildTiles,
  chunkAnswer,
  checkSlots,
  checkTiles,
  chunkSentence,
  chunksText,
  defaultMode,
  localScore,
  presentFromPast,
  sentences,
  slotsText,
  tilesText,
  wrongTilePositions,
} from "./writing-builder";

const p = (over: Partial<Prompt>): Prompt => ({
  key: "writing:A1:x",
  level: "A1",
  genre: "journal",
  prompt_kr: "오늘 아침을 먹었어요? '-았어요/었어요'를 사용해서 써 보세요.",
  prompt_en: "Did you eat breakfast?",
  example_kr: "저는 오늘 아침에 빵을 먹었어요. 우유도 마셨어요.",
  ...over,
});

const siblings: Prompt[] = [
  p({ key: "s1", example_kr: "저는 어제 저녁에 텔레비전을 봤어요. 그리고 일찍 잤어요." }),
  p({ key: "s2", example_kr: "오늘 날씨가 추워요. 눈도 조금 와요." }),
  p({ key: "s3", example_kr: "저는 학교에 가요. 친구를 만나요." }),
];

describe("defaultMode", () => {
  it("climbs through the plan across a 4-question chapter", () => {
    expect([0, 1, 2, 3].map((i) => defaultMode("A1", i, 4))).toEqual(["tiles", "tiles", "tiles", "slots"]);
    expect([0, 1, 2, 3].map((i) => defaultMode("B1", i, 4))).toEqual(["slots", "slots", "chunks", "chunks"]);
    expect([0, 1, 2, 3].map((i) => defaultMode("C2", i, 4))).toEqual(["type", "type", "type", "type"]);
  });
  it("handles odd chapter sizes", () => {
    expect(defaultMode("A2", 0, 1)).toBe("tiles");
    expect(defaultMode("A2", 1, 2)).toBe("slots");
  });
});

describe("tiles", () => {
  const board = buildTiles(p({}), siblings.flatMap((s) => s.example_kr.split(" ")), 7);

  it("keeps every answer word and adds distractors that aren't in the answer", () => {
    expect(board.answer).toEqual(["저는", "오늘", "아침에", "빵을", "먹었어요.", "우유도", "마셨어요."]);
    expect(board.tiles.length).toBe(board.answer.length + 3);
    const texts = board.tiles.map((t) => t.text);
    for (const w of board.answer) expect(texts).toContain(w);
    const extras = texts.filter((t) => !board.answer.includes(t));
    expect(extras.length).toBe(3);
    for (const e of extras) expect(board.answer.map((w) => w.replace(/[.]$/, ""))).not.toContain(e);
  });

  it("is deterministic for a seed and different for another", () => {
    const again = buildTiles(p({}), siblings.flatMap((s) => s.example_kr.split(" ")), 7);
    expect(again.tiles).toEqual(board.tiles);
    const other = buildTiles(p({}), siblings.flatMap((s) => s.example_kr.split(" ")), 8);
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

  it("uses only 2 distractors for long answers", () => {
    const long = p({ example_kr: "저는 오늘 아침에 일찍 일어나서 빵을 먹고 우유를 마시고 학교에 갔어요." });
    const b = buildTiles(long, siblings.flatMap((s) => s.example_kr.split(" ")), 1);
    expect(b.tiles.length).toBe(b.answer.length + 2);
  });
});

describe("presentFromPast", () => {
  it("handles the regular and contracted A1 forms", () => {
    expect(presentFromPast("먹었어요.")).toBe("먹어요.");
    expect(presentFromPast("갔어요")).toBe("가요");
    expect(presentFromPast("봤어요.")).toBe("봐요.");
    expect(presentFromPast("했어요")).toBe("해요");
    expect(presentFromPast("마셨어요.")).toBe("마셔요.");
    expect(presentFromPast("좋았어요")).toBe("좋아요");
    expect(presentFromPast("추워요")).toBeNull();
    expect(presentFromPast("빵을")).toBeNull();
  });
});

describe("slots", () => {
  it("targets past-tense endings when the prompt asks for them", () => {
    const board = buildSlots(p({}), 3)!;
    expect(board).not.toBeNull();
    expect(board.slots.length).toBe(2);
    expect(board.slots.map((s) => s.kind)).toEqual(["ending", "ending"]);
    expect(board.slots.map((s) => s.answer)).toEqual(["먹었어요.", "마셨어요."]);
    for (const s of board.slots) {
      expect(s.options).toContain(s.answer);
      expect(new Set(s.options).size).toBe(s.options.length);
      expect(s.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("targets particles otherwise, with a same-role lookalike among the options", () => {
    const board = buildSlots(p({ prompt_kr: "오늘 날씨가 어때요?", example_kr: "저는 학교에 가요. 친구를 만나요." }), 3)!;
    expect(board.slots.map((s) => s.kind)).toEqual(["particle", "particle"]);
    const first = board.slots[0];
    expect(first.answer).toBe("저는");
    expect(first.options).toContain("저는");
    expect(first.options.some((o) => ["저은", "저이", "저가"].includes(o))).toBe(true);
  });

  it("returns null when there is nothing to blank", () => {
    expect(buildSlots(p({ prompt_kr: "x", example_kr: "네." }), 1)).toBeNull();
  });

  it("checks each slot and renders the sentence with blanks", () => {
    const board = buildSlots(p({}), 3)!;
    expect(checkSlots(board, ["먹었어요.", "마셔요."])).toEqual([true, false]);
    expect(slotsText(board, ["먹었어요.", null])).toBe("저는 오늘 아침에 빵을 먹었어요. 우유도 ____");
  });
});

describe("chunks", () => {
  it("splits into phrase-sized blocks and isolates connectors", () => {
    expect(sentences("저는 어제 저녁에 텔레비전을 봤어요. 그리고 일찍 잤어요.")).toEqual([
      "저는 어제 저녁에 텔레비전을 봤어요.",
      "그리고 일찍 잤어요.",
    ]);
    expect(chunkSentence("그리고 일찍 잤어요.")).toEqual(["그리고", "일찍 잤어요."]);
    const c = chunkSentence("저는 어제 저녁에 텔레비전을 봤어요.");
    expect(c.join(" ")).toBe("저는 어제 저녁에 텔레비전을 봤어요.");
    expect(c.every((x) => x.split(" ").length <= 3)).toBe(true);
  });

  it("grows the blocks so a long answer still fits in about eight", () => {
    const long =
      "오늘부터 밤늦게 휴대폰을 보지 않기로 마음먹었어요. 대신 자기 전에 책을 읽기로 했어요. 작심삼일이 될까 봐 걱정이지만 일단 해 볼 생각이에요.";
    expect(sentences(long).flatMap((s) => chunkSentence(s)).length).toBeGreaterThan(8);
    const c = chunkAnswer(long);
    expect(c.length).toBeLessThanOrEqual(8);
    expect(c.join(" ")).toBe(long);
  });

  it("adds a few foreign blocks and joins picks back into text", () => {
    const board = buildChunks(p({}), siblings.map((s) => s.example_kr), 5);
    const own = chunkAnswer(p({}).example_kr);
    expect(board.chunks.length).toBe(own.length + 3);
    const ids = own.map((t) => board.chunks.find((c) => c.text === t)!.id);
    expect(chunksText(board, ids)).toBe(p({}).example_kr);
  });
});

describe("buildBoard", () => {
  it("falls back to tiles when slots can't be built", () => {
    const b = buildBoard("slots", p({ prompt_kr: "x", example_kr: "네." }), siblings, 0);
    expect(b.mode).toBe("tiles");
  });
  it("reseeds per attempt", () => {
    const a = buildBoard("tiles", p({}), siblings, 0);
    const b = buildBoard("tiles", p({}), siblings, 1);
    expect(a).not.toEqual(b);
  });
});

describe("localScore", () => {
  it("rewards the first try and floors at 60", () => {
    expect(localScore(1)).toBe(100);
    expect(localScore(2)).toBe(85);
    expect(localScore(9)).toBe(60);
  });
});
