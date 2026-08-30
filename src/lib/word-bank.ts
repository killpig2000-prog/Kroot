import type { SupabaseClient } from "@supabase/supabase-js";
import type { VocabWord } from "@/lib/vocabulary";

// Tap-to-save word bank: maps a Korean surface form found in listening /
// reading / grammar / slang text back to a word in the daily-life deck, so
// one tap can plant it into vocabulary_progress (the SRS "Watering" queue).
//
// The 4k-word dictionary is loaded lazily on the first lookup (dynamic
// import), never in the initial bundle of the page that renders the text.

let dictPromise: Promise<Map<string, VocabWord>> | null = null;

function loadDict(): Promise<Map<string, VocabWord>> {
  if (!dictPromise) {
    dictPromise = import("@/lib/vocabulary").then(({ getWordsForTopic }) => {
      const map = new Map<string, VocabWord>();
      for (const w of getWordsForTopic("daily-life")) {
        // Lower levels win when the same surface form appears twice; entries
        // like "안녕/안녕하세요" index each alternative.
        for (const form of w.korean.split("/")) {
          const k = form.trim();
          if (k && !map.has(k)) map.set(k, w);
        }
      }
      return map;
    });
  }
  return dictPromise;
}

const PUNCT_RE = /[.,!?~"'“”‘’·…\-—()[\]{}:;]/g;

// Trailing particles / copula endings, longest first so "에서" wins over "에".
const PARTICLES = [
  "이에요", "입니다", "에서는", "으로는", "에게는", "한테는",
  "에서", "으로", "하고", "에게", "한테", "까지", "부터", "예요", "이나",
  "은", "는", "이", "가", "을", "를", "에", "도", "의", "로", "와", "과", "만", "요", "나",
];

// Verb / adjective endings → strip, then re-attach 다 to get the dictionary form.
// "공부해요" → 공부 + 하다, "먹어요" → 먹 + 다, "가세요" → 가 + 다.
const HADA_ENDINGS = ["했어요", "합니다", "하세요", "해요", "하고", "해서", "하면", "하지", "한"];
const VERB_ENDINGS = [
  "었어요", "았어요", "습니다", "으세요", "세요", "어요", "아요", "ㅂ니다",
  "고", "서", "면", "지", "는", "은", "을", "ㄹ",
];

export function normalizeToken(token: string): string {
  return token.replace(PUNCT_RE, "").trim();
}

/**
 * Every dictionary form a surface token could reduce to, longest-first —
 * "포근했어요" → 포근하다, "친구한테는" → 친구. Exported so the reading page can
 * resolve a whole passage's tokens server-side (see lib/word-links.ts).
 */
export function surfaceCandidates(token: string): string[] {
  const base = normalizeToken(token);
  if (!base) return [];
  const out: string[] = [base];
  const push = (s: string) => {
    if (s && s.length >= 1 && !out.includes(s)) out.push(s);
  };

  for (const p of PARTICLES) {
    if (base.length > p.length && base.endsWith(p)) push(base.slice(0, -p.length));
  }
  for (const e of HADA_ENDINGS) {
    if (base.length > e.length && base.endsWith(e)) push(base.slice(0, -e.length) + "하다");
  }
  for (const e of VERB_ENDINGS) {
    if (base.length > e.length && base.endsWith(e)) push(base.slice(0, -e.length) + "다");
  }
  // A particle stacked on a stripped form: "친구한테는" → 친구한테 → 친구.
  const second = [...out];
  for (const s of second) {
    for (const p of PARTICLES) {
      if (s.length > p.length && s.endsWith(p)) push(s.slice(0, -p.length));
    }
  }
  return out;
}

/** Resolve a tapped token to a deck word, or null when it isn't in the deck. */
export async function lookupWord(token: string): Promise<VocabWord | null> {
  const dict = await loadDict();
  for (const c of surfaceCandidates(token)) {
    const hit = dict.get(c);
    if (hit) return hit;
  }
  return null;
}

export type KoreanToken = { text: string; isWord: boolean };

const SPLIT_RE = /([\s.,!?~"'“”‘’·…\-—()[\]{}:;]+)/;
const HANGUL_RE = /[가-힣]/;

/** Split a line into word / separator chunks that re-join to the exact original. */
export function tokenizeKorean(text: string): KoreanToken[] {
  return text
    .split(SPLIT_RE)
    .filter((t) => t.length > 0)
    .map((t) => ({ text: t, isWord: HANGUL_RE.test(t) }));
}

// ---------------------------------------------------------------------------
// Saving into the word bank. Shared by tap-to-save (TapText) and the public
// dictionary page's "Add to my words" button so both write identical rows.

/** vocabulary_progress.word_key for a word — mirrors getWordsForTopic(). */
export function wordBankKey(topicKey: string, level: string, korean: string): string {
  return `${topicKey}:${level}:${korean}`;
}

/**
 * Plant a word into vocabulary_progress (box 1, due now). A word that is
 * already there keeps its box and counts — the upsert ignores duplicates.
 * Resolves to an error message, or null on success.
 */
export async function plantWord(
  supabase: SupabaseClient,
  userId: string,
  wordKey: string
): Promise<string | null> {
  const { error } = await supabase.from("vocabulary_progress").upsert(
    {
      user_id: userId,
      word_key: wordKey,
      correct_count: 0,
      incorrect_count: 0,
      box: 1,
      next_review_at: new Date().toISOString(),
      last_reviewed_at: null,
    },
    { onConflict: "user_id,word_key", ignoreDuplicates: true }
  );
  return error ? error.message : null;
}

/** Words whose next_review_at has passed — the Review tab badge number. */
export async function countDueWords(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("vocabulary_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("next_review_at", new Date().toISOString());
  return error ? 0 : (count ?? 0);
}

// ---------------------------------------------------------------------------
// The capped word bank (migration 0039). `vocabulary_progress.saved` is the
// hand-picked shortlist — review history lives in the same row, so unsaving a
// word only clears the flag. `profiles.word_bank_slots` is the capacity
// (20 by default, up to 60 via the shop).

export const DEFAULT_WORD_BANK_SLOTS = 20;
export const MAX_WORD_BANK_SLOTS = 60;
export const SLOTS_PRICE = 200;
export const SLOTS_PER_PURCHASE = 10;

/** Capacity for this learner — the default when the column/row can't be read. */
export async function getWordBankSlots(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select("word_bank_slots")
    .eq("id", userId)
    .maybeSingle();
  if (error) return DEFAULT_WORD_BANK_SLOTS;
  const n = (data as { word_bank_slots?: number | null } | null)?.word_bank_slots;
  return typeof n === "number" ? n : DEFAULT_WORD_BANK_SLOTS;
}

/** How many words are currently picked. 0 when the count can't be read. */
export async function countSavedWords(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("vocabulary_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("saved", true);
  return error ? 0 : (count ?? 0);
}

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "full"; used: number; slots: number }
  | { ok: false; reason: "error" };

/**
 * Pick a word into the bank, respecting the cap. An existing row is flagged
 * saved (its box and counts survive); a new one starts at box 1, due now.
 */
export async function saveToBank(
  supabase: SupabaseClient,
  userId: string,
  wordKey: string
): Promise<SaveResult> {
  const [used, slots] = await Promise.all([
    countSavedWords(supabase, userId),
    getWordBankSlots(supabase, userId),
  ]);
  if (used >= slots) return { ok: false, reason: "full", used, slots };

  // Flag an existing row rather than upserting, so review history survives.
  const upd = await supabase
    .from("vocabulary_progress")
    .update({ saved: true })
    .eq("user_id", userId)
    .eq("word_key", wordKey)
    .select("word_key");
  if (upd.error) return { ok: false, reason: "error" };
  if ((upd.data ?? []).length > 0) return { ok: true };

  const ins = await supabase.from("vocabulary_progress").insert({
    user_id: userId,
    word_key: wordKey,
    correct_count: 0,
    incorrect_count: 0,
    box: 1,
    next_review_at: new Date().toISOString(),
    last_reviewed_at: null,
    saved: true,
  });
  // A row inserted by a concurrent tap is a success, not a failure.
  if (ins.error && ins.error.code !== "23505") return { ok: false, reason: "error" };
  return { ok: true };
}

/** Flip the bank flag without losing what the row remembers about the word. */
export async function setSaved(
  supabase: SupabaseClient,
  userId: string,
  wordKey: string,
  saved: boolean
): Promise<string | null> {
  const { error } = await supabase
    .from("vocabulary_progress")
    .update({ saved })
    .eq("user_id", userId)
    .eq("word_key", wordKey);
  return error ? error.message : null;
}
