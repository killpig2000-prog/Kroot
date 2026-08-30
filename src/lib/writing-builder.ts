import type { CefrLevel } from "@/lib/tree";
import type { Prompt } from "@/lib/writing";

// Tap-to-assemble Writing. Learners at A1–A2 mostly can't type Korean, so
// instead of a blank textarea each prompt gets a board built from its model
// answer (example_kr):
//
//   tiles  — the answer's words, shuffled with a few distractors; put them
//            back in order. Checked locally, no API call.
//   slots  — the sentence is given with 1–2 grammar slots (a particle or a
//            verb ending) blanked out; pick the right form. Local check.
//   chunks — phrase-sized blocks from this answer plus a few from sibling
//            prompts; any natural order is fine, so it goes to the grader.
//   type   — the original free-text box.
//
// Everything here is pure and deterministic for a given seed so the server
// and client render the same board (no hydration mismatch); a retry reseeds.

export type BuildMode = "tiles" | "slots" | "chunks" | "type";

export const MODE_LABEL: Record<BuildMode, string> = {
  tiles: "Build it",
  slots: "Fill the blanks",
  chunks: "Build with blocks",
  type: "Type it",
};

// Default mode per (level, position-in-chapter). Later questions in a
// chapter loosen up so the fourth answer always asks a little more than the
// first. C1/C2 stay free-text; the toggle can still bring the boards back.
const MODE_PLAN: Record<CefrLevel, BuildMode[]> = {
  A1: ["tiles", "tiles", "tiles", "slots"],
  A2: ["tiles", "tiles", "slots", "slots"],
  B1: ["slots", "slots", "chunks", "chunks"],
  B2: ["slots", "chunks", "chunks", "chunks"],
  C1: ["type", "type", "type", "type"],
  C2: ["type", "type", "type", "type"],
};

export function defaultMode(level: CefrLevel, index: number, size: number): BuildMode {
  const plan = MODE_PLAN[level];
  // Map the position onto the 4-slot plan so odd chapter sizes still climb.
  const slot = size <= 1 ? 0 : Math.min(plan.length - 1, Math.floor((index / (size - 1)) * (plan.length - 1)));
  return plan[slot];
}

/** Modes whose answer is known-correct once checked — never sent to the grader. */
export function isLocalMode(mode: BuildMode): boolean {
  return mode === "tiles" || mode === "slots";
}

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

const HANGUL = /[가-힣]/;

/** Strip trailing punctuation for comparisons ("먹었어요." → "먹었어요"). */
function core(w: string): string {
  return w.replace(/[.,!?…]+$/g, "");
}

// ---------------------------------------------------------------------------
// tiles
// ---------------------------------------------------------------------------

export type Tile = { id: string; text: string };

export type TileBoard = {
  mode: "tiles";
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
export function buildTiles(prompt: Prompt, pool: string[], seed: number): TileBoard {
  const rand = rng(seed);
  const answer = words(prompt.example_kr);
  // Long answers already have plenty to sort; keep the board tappable.
  const want = answer.length >= 10 ? 2 : 3;
  const distractors = pickDistractors(answer, pool, want, rand);
  const all = [...answer, ...distractors].map((text, i) => ({ id: `t${i}`, text }));
  return { mode: "tiles", answer, tiles: shuffle(all, rand) };
}

/** True when the picked tiles, in order, spell the answer. */
export function checkTiles(board: TileBoard, pickedIds: string[]): boolean {
  if (pickedIds.length !== board.answer.length) return false;
  const byId = new Map(board.tiles.map((t) => [t.id, t.text]));
  return pickedIds.every((id, i) => byId.get(id) === board.answer[i]);
}

/** Indices in the picked sequence that don't match — for the red highlight. */
export function wrongTilePositions(board: TileBoard, pickedIds: string[]): number[] {
  const byId = new Map(board.tiles.map((t) => [t.id, t.text]));
  const out: number[] = [];
  pickedIds.forEach((id, i) => {
    if (byId.get(id) !== board.answer[i]) out.push(i);
  });
  return out;
}

export function tilesText(board: TileBoard, pickedIds: string[]): string {
  const byId = new Map(board.tiles.map((t) => [t.id, t.text]));
  return pickedIds.map((id) => byId.get(id) ?? "").join(" ");
}

// ---------------------------------------------------------------------------
// slots
// ---------------------------------------------------------------------------

export type Slot = {
  /** Index into words(example_kr). */
  index: number;
  /** The full correct word, punctuation included. */
  answer: string;
  /** Shuffled options, each a full word (answer among them). */
  options: string[];
  kind: "particle" | "ending";
};

export type SlotBoard = {
  mode: "slots";
  words: string[];
  slots: Slot[];
};

// Particles we can swap in and out of a noun. Order matters only for the
// "wrong but plausible" alternatives: same-role particles first.
const PARTICLE_GROUPS: string[][] = [
  ["은", "는", "이", "가"],
  ["을", "를"],
  ["에", "에서", "로", "으로"],
  ["도", "만"],
  ["와", "과", "하고"],
];
const ALL_PARTICLES = PARTICLE_GROUPS.flat().sort((a, b) => b.length - a.length);

function particleOf(w: string): { stem: string; particle: string } | null {
  const c = core(w);
  if (c.length < 2) return null;
  for (const p of ALL_PARTICLES) {
    if (c.endsWith(p) && c.length > p.length) return { stem: c.slice(0, -p.length), particle: p };
  }
  return null;
}

// Hangul syllable arithmetic — enough to turn a past-tense verb back into
// its present form for the distractor.
const BASE = 0xac00;
const JONG_SS = 20; // ㅆ
function decompose(ch: string): [number, number, number] | null {
  const code = ch.charCodeAt(0) - BASE;
  if (code < 0 || code > 11171) return null;
  return [Math.floor(code / 588), Math.floor((code % 588) / 28), code % 28];
}
function compose(cho: number, jung: number, jong: number): string {
  return String.fromCharCode(BASE + cho * 588 + jung * 28 + jong);
}

/** 먹었어요 → 먹어요, 봤어요 → 봐요, 했어요 → 해요; null if not a past form we recognise. */
export function presentFromPast(word: string): string | null {
  const c = core(word);
  const tail = word.slice(c.length);
  if (c.endsWith("했어요")) return c.slice(0, -3) + "해요" + tail;
  if (c.endsWith("았어요")) return c.slice(0, -3) + "아요" + tail;
  if (c.endsWith("었어요")) return c.slice(0, -3) + "어요" + tail;
  if (c.endsWith("어요") && c.length >= 3) {
    const prev = c[c.length - 3];
    const d = decompose(prev);
    if (d && d[2] === JONG_SS) return c.slice(0, -3) + compose(d[0], d[1], 0) + "요" + tail;
  }
  return null;
}

/** Swap 아↔어 vowel harmony in the last ending — a plausible-looking wrong form. */
function harmonySwap(word: string): string | null {
  const c = core(word);
  const tail = word.slice(c.length);
  if (c.endsWith("았어요")) return c.slice(0, -3) + "었어요" + tail;
  if (c.endsWith("었어요")) return c.slice(0, -3) + "았어요" + tail;
  if (c.endsWith("아요")) return c.slice(0, -2) + "어요" + tail;
  if (c.endsWith("어요") && !c.endsWith("했어요")) return c.slice(0, -2) + "아요" + tail;
  return null;
}

function isPastEnding(w: string): boolean {
  return presentFromPast(w) !== null;
}

function endingOptions(word: string, rand: () => number): string[] | null {
  const present = presentFromPast(word);
  if (!present) return null;
  const opts = [word, present];
  const alt = harmonySwap(word) ?? harmonySwap(present);
  if (alt && !opts.includes(alt)) opts.push(alt);
  if (opts.length < 3) {
    const tail = word.slice(core(word).length);
    const future = core(present).replace(/[아어해]요$/, "") + "ㄹ 거예요" + tail;
    if (!opts.includes(future)) opts.push(future);
  }
  return shuffle(opts.slice(0, 3), rand);
}

function particleOptions(word: string, rand: () => number): string[] | null {
  const p = particleOf(word);
  if (!p) return null;
  const tail = word.slice(core(word).length);
  const group = PARTICLE_GROUPS.find((g) => g.includes(p.particle)) ?? [];
  const others = shuffle(
    [...group.filter((x) => x !== p.particle), ...ALL_PARTICLES.filter((x) => !group.includes(x))],
    rand
  );
  // One same-role neighbour (은↔는, 을↔를) + one from another role keeps it
  // a real choice rather than a coin flip between two lookalikes.
  const sameRole = others.find((x) => group.includes(x));
  const otherRole = others.find((x) => !group.includes(x));
  const opts = [word, ...[sameRole, otherRole].filter(Boolean).map((x) => p.stem + x + tail)];
  return shuffle(opts, rand);
}

/**
 * Up to two slots. The prompt's own grammar hint decides what to blank
 * first: a past-tense hint ('-았어요/었어요') targets verb endings,
 * otherwise particles. Returns null when nothing suitable exists — the
 * caller falls back to tiles.
 */
export function buildSlots(prompt: Prompt, seed: number): SlotBoard | null {
  const rand = rng(seed);
  const ws = words(prompt.example_kr);
  const wantsPast = /았어요|었어요|과거/.test(prompt.prompt_kr);

  const endings = ws.map((w, i) => (isPastEnding(w) ? i : -1)).filter((i) => i >= 0);
  const particles = ws.map((w, i) => (particleOf(w) ? i : -1)).filter((i) => i >= 0);

  const order = wantsPast ? [...endings, ...particles] : [...particles, ...endings];
  const slots: Slot[] = [];
  for (const index of order) {
    if (slots.length >= 2) break;
    if (slots.some((s) => s.index === index)) continue;
    const word = ws[index];
    const kind: Slot["kind"] = isPastEnding(word) && (wantsPast || !particleOf(word)) ? "ending" : "particle";
    const options = kind === "ending" ? endingOptions(word, rand) : particleOptions(word, rand);
    if (!options || options.length < 2) continue;
    slots.push({ index, answer: word, options, kind });
  }
  if (slots.length === 0) return null;
  slots.sort((a, b) => a.index - b.index);
  return { mode: "slots", words: ws, slots };
}

export function checkSlots(board: SlotBoard, chosen: (string | null)[]): boolean[] {
  return board.slots.map((s, i) => chosen[i] === s.answer);
}

export function slotsText(board: SlotBoard, chosen: (string | null)[]): string {
  const out = board.words.slice();
  board.slots.forEach((s, i) => {
    out[s.index] = chosen[i] ?? "____";
  });
  return out.join(" ");
}

// ---------------------------------------------------------------------------
// chunks
// ---------------------------------------------------------------------------

export type ChunkBoard = {
  mode: "chunks";
  chunks: Tile[];
};

const CONNECTORS = new Set(["그리고", "그래서", "하지만", "그런데", "또", "왜냐하면", "그러면", "그래도"]);

/** Cut one sentence into phrase-sized blocks (1–maxWords words). */
export function chunkSentence(sentence: string, maxWords = 3): string[] {
  const ws = words(sentence);
  const out: string[] = [];
  let cur: string[] = [];
  for (const w of ws) {
    if (CONNECTORS.has(core(w))) {
      if (cur.length) out.push(cur.join(" "));
      cur = [];
      out.push(w);
      continue;
    }
    cur.push(w);
    // Close a chunk after a particle-bearing word once it's most of the way
    // to maxWords, or at maxWords regardless, so blocks read as phrases.
    if ((cur.length >= Math.max(2, maxWords - 1) && particleOf(w)) || cur.length >= maxWords) {
      out.push(cur.join(" "));
      cur = [];
    }
  }
  if (cur.length) out.push(cur.join(" "));
  return out;
}

/** The board should stay tappable: grow the blocks until the answer fits in ~8. */
export const MAX_OWN_CHUNKS = 8;

export function chunkAnswer(text: string): string[] {
  for (const size of [3, 4, 5, 6, 8]) {
    const out = sentences(text).flatMap((s) => chunkSentence(s, size));
    if (out.length <= MAX_OWN_CHUNKS) return out;
  }
  return sentences(text);
}

export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param siblings example_kr of other prompts in the same level+genre —
 *   source of 2–3 extra blocks that don't belong.
 */
export function buildChunks(prompt: Prompt, siblings: string[], seed: number): ChunkBoard {
  const rand = rng(seed);
  const own = chunkAnswer(prompt.example_kr);
  const ownSet = new Set(own);
  const extra = shuffle(
    siblings.flatMap(chunkAnswer).filter((c) => !ownSet.has(c) && words(c).length >= 2),
    rand
  ).slice(0, own.length >= 6 ? 2 : 3);
  const all = [...own, ...extra].map((text, i) => ({ id: `c${i}`, text }));
  return { mode: "chunks", chunks: shuffle(all, rand) };
}

export function chunksText(board: ChunkBoard, pickedIds: string[]): string {
  const byId = new Map(board.chunks.map((t) => [t.id, t.text]));
  return pickedIds
    .map((id) => byId.get(id) ?? "")
    .join(" ")
    .replace(/\s+([.,!?])/g, "$1");
}

// ---------------------------------------------------------------------------
// Board factory
// ---------------------------------------------------------------------------

export type Board = TileBoard | SlotBoard | ChunkBoard | { mode: "type" };

export function buildBoard(
  mode: BuildMode,
  prompt: Prompt,
  siblings: Prompt[],
  attempt: number
): Board {
  const seed = hashString(`${prompt.key}#${attempt}`);
  const others = siblings.filter((p) => p.key !== prompt.key);
  switch (mode) {
    case "tiles":
      return buildTiles(prompt, others.flatMap((p) => words(p.example_kr)), seed);
    case "slots":
      return buildSlots(prompt, seed) ?? buildTiles(prompt, others.flatMap((p) => words(p.example_kr)), seed);
    case "chunks":
      return buildChunks(
        prompt,
        others.filter((p) => p.genre === prompt.genre).map((p) => p.example_kr),
        seed
      );
    default:
      return { mode: "type" };
  }
}

/** Score for a locally-checked board: first try is perfect, each retry costs a little. */
export function localScore(attempts: number): number {
  return Math.max(60, 100 - Math.max(0, attempts - 1) * 15);
}
