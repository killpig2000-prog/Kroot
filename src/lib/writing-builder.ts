import type { Prompt } from "@/lib/writing";

// Tap-to-assemble Writing. Learners at A1–A2 mostly can't type Korean, so
// instead of a blank textarea every prompt gets a tile board built from its
// model answer (example_kr): the answer's words, shuffled with a couple of
// distractors, put back in order. Checked locally — no grader, no API call.
//
// Boards are pure and deterministic for a given seed so the server and the
// first client render agree (no hydration mismatch); "shuffle" reseeds.

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

// 2026-09-11 (user: "A는 3~6개, B는 6~8개, C는 8~10개면 될거같은데" — a
// total-tile budget per CEFR tier, not just a distractor cap): C-level
// sentences run 9-16 words on their own, already past any of these
// ceilings before a single distractor is added. Long answers are grouped
// into a handful of multi-word tiles ("좀더 큼직하게 묶거나") instead of one
// tile per word, so a 16-word C2 sentence still lands inside its tier's
// budget.
const TIER_MAX: Record<string, number> = { A1: 6, A2: 6, B1: 8, B2: 8, C1: 10, C2: 10 };

/** Merge `words` down to at most `groups` tiles, splitting as evenly as
 * possible and keeping every word in its original order — group N joins
 * back to the exact original text with `.join(" ")`, so nothing downstream
 * (the "correct sentence" readout, scoring) needs to know tiles can now
 * hold more than one word. */
function groupWords(list: string[], groups: number): string[] {
  if (groups >= list.length) return list;
  const base = Math.floor(list.length / groups);
  const extra = list.length % groups;
  const out: string[] = [];
  let i = 0;
  for (let g = 0; g < groups; g++) {
    const size = base + (g < extra ? 1 : 0);
    out.push(list.slice(i, i + size).join(" "));
    i += size;
  }
  return out;
}

const HANGUL = /[가-힣]/;

/** Strip trailing punctuation for comparisons ("먹었어요." → "먹었어요"). */
function core(w: string): string {
  return w.replace(/[.,!?…]+$/g, "");
}

// ---------------------------------------------------------------------------
// tiles
// ---------------------------------------------------------------------------

export type Tile = { id: string; text: string };

export type Board = {
  /** The correct sequence, one entry per word of example_kr. */
  answer: string[];
  /** Every tile on the board (answer words + distractors), shuffled. */
  tiles: Tile[];
};

function pickDistractors(answer: string[], pool: string[], want: number, rand: () => number): string[] {
  const have = new Set(answer.map(core));
  const candidates = pool.map(core).filter((w, i, arr) => w && HANGUL.test(w) && !have.has(w) && arr.indexOf(w) === i);
  const out: string[] = [];
  const shuffled = shuffle(candidates, rand);
  for (const w of shuffled) {
    if (out.length >= want) break;
    out.push(w);
  }
  return out;
}

/**
 * @param pool words from sibling prompts (same level) — distractor source.
 */
export function buildBoard(prompt: Prompt, pool: string[], seed: number): Board {
  const rand = rng(seed);
  const rawWords = words(prompt.example_kr);
  // Whole-board budget for this tier (answer tiles + distractors together),
  // not just a distractor cap — see groupWords above for the long-sentence
  // half of this.
  const tierMax = TIER_MAX[prompt.level] ?? 8;
  const answer = groupWords(rawWords, tierMax);
  const want = Math.max(0, Math.min(2, tierMax - answer.length));
  const distractors = pickDistractors(answer, pool, want, rand);
  const all = [...answer, ...distractors].map((text, i) => ({ id: `t${i}`, text }));
  return { answer, tiles: shuffle(all, rand) };
}

/** True when the picked tiles, in order, spell the answer. */
export function checkTiles(board: Board, pickedIds: string[]): boolean {
  if (pickedIds.length !== board.answer.length) return false;
  const byId = new Map(board.tiles.map((t) => [t.id, t.text]));
  return pickedIds.every((id, i) => byId.get(id) === board.answer[i]);
}

/** Indices in the picked sequence that don't match — for the red highlight. */
export function wrongTilePositions(board: Board, pickedIds: string[]): number[] {
  const byId = new Map(board.tiles.map((t) => [t.id, t.text]));
  const out: number[] = [];
  pickedIds.forEach((id, i) => {
    if (byId.get(id) !== board.answer[i]) out.push(i);
  });
  return out;
}

export function tilesText(board: Board, pickedIds: string[]): string {
  const byId = new Map(board.tiles.map((t) => [t.id, t.text]));
  return pickedIds.map((id) => byId.get(id) ?? "").join(" ");
}

/** Score for a locally-checked board, by how many Check presses it took. */
export function localScore(attempts: number): number {
  return Math.max(60, 100 - (Math.max(1, attempts) - 1) * 15);
}

/** Share of tile positions that match the answer, 0-100 — checking now
 * happens once, after the whole chapter is submitted, not per question. */
export function tileMatchScore(board: Board, pickedIds: string[]): number {
  if (pickedIds.length === 0) return 0;
  const wrong = wrongTilePositions(board, pickedIds).length;
  return Math.round(((pickedIds.length - wrong) / board.answer.length) * 100);
}
