// Generate per-word morpheme notes for the vocabulary decks: Sino-Korean
// words get a hanja breakdown ("시(試 to test) + 험(驗 to examine)"), loanwords
// get their origin. Output: src/lib/vocabulary-data/word-notes.json, keyed by
// the Korean word. Re-runnable: already-noted words are skipped.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/gen-word-notes.mts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { DAILY_LIFE_WORDS } from "@/lib/vocabulary-data/daily-life";

// Free-tier quotas are per model — rotate through equivalents as each runs dry.
const MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
];
let modelIndex = 0;
const BATCH = 40;
// Free-tier RPM allows a few requests in flight; 3 workers stay well under it.
const CONCURRENCY = 3;
const OUT = new URL("../src/lib/vocabulary-data/word-notes.json", import.meta.url);

const apiKey = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .match(/GEMINI_API_KEY=(.+)/)![1]
  .trim();

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      korean: { type: "STRING" },
      kind: {
        type: "STRING",
        enum: ["sino", "loan", "native", "unsure"],
        description:
          "sino = Sino-Korean compound with 2+ hanja morphemes; loan = borrowed from another language; native = native Korean; unsure = cannot say with confidence",
      },
      parts: {
        type: "ARRAY",
        description:
          "For kind=sino only: one entry per syllable morpheme, in order.",
        items: {
          type: "OBJECT",
          properties: {
            syllable: { type: "STRING", description: "the hangul syllable, e.g. 시" },
            hanja: { type: "STRING", description: "the hanja character, e.g. 試" },
            gloss: { type: "STRING", description: "2-4 word English meaning, e.g. 'to test'" },
          },
          required: ["syllable", "hanja", "gloss"],
        },
      },
      origin: {
        type: "STRING",
        description: "For kind=loan only: source, e.g. 'English \"coffee\"'",
      },
    },
    required: ["korean", "kind"],
  },
};

type Note = {
  korean: string;
  kind: "sino" | "loan" | "native" | "unsure";
  parts?: { syllable: string; hanja: string; gloss: string }[];
  origin?: string;
};

const notes: Record<string, string> = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, "utf8"))
  : {};

const seen = new Set<string>();
const words = DAILY_LIFE_WORDS.filter((w) => {
  if (seen.has(w.korean) || w.korean in notes) return false;
  seen.add(w.korean);
  return true;
});
console.log(`to analyze: ${words.length} words (${Object.keys(notes).length} already done)`);

function render(n: Note): string | null {
  if (n.kind === "sino" && n.parts && n.parts.length >= 2) {
    // Reject breakdowns that don't reassemble into the word.
    const joined = n.parts.map((p) => p.syllable).join("");
    if (!n.korean.startsWith(joined) && joined !== n.korean) return null;
    return n.parts.map((p) => `${p.syllable}(${p.hanja} ${p.gloss})`).join(" + ");
  }
  if (n.kind === "loan" && n.origin) return `from ${n.origin}`;
  return null;
}

async function callGemini(prompt: string, tag: string): Promise<Response | null> {
  let transient = 0;
  while (modelIndex < MODELS.length) {
    const idx = modelIndex;
    const model = MODELS[idx];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.1,
          },
        }),
      }
    ).catch(() => null);
    if (res?.ok) return res;
    if (!res) {
      // Stale keep-alive socket (WSL2 drops idle connections) — a fresh
      // attempt reconnects instantly, so no backoff.
      if (++transient > 10) return null;
      continue;
    }
    if (res.status === 429) {
      // Quota for this model is likely spent for the day — move to the next.
      // Guard the increment: another worker may have already rotated.
      if (modelIndex === idx) {
        modelIndex++;
        console.error(`${tag}: 429 on ${model}, switching to ${MODELS[modelIndex] ?? "(none left)"}`);
      }
      transient = 0;
      continue;
    }
    // 5xx (overloaded) is transient — brief backoff, retire the model if it persists.
    transient++;
    console.error(`${tag}: HTTP ${res.status}, retry ${transient}`);
    if (transient >= 4) {
      if (modelIndex === idx) {
        modelIndex++;
        console.error(`${tag}: retiring ${model}, next: ${MODELS[modelIndex] ?? "(none left)"}`);
      }
      transient = 0;
      continue;
    }
    await new Promise((r) => setTimeout(r, 10_000 * transient));
  }
  return null;
}

const batches: (typeof words)[] = [];
for (let i = 0; i < words.length; i += BATCH) batches.push(words.slice(i, i + BATCH));
let nextBatch = 0;
let done = 0;

async function worker(): Promise<void> {
  for (;;) {
    const bi = nextBatch++;
    if (bi >= batches.length) return;
    const batch = batches[bi];
    const prompt = `You are a Korean etymology expert helping English-speaking learners.
For each word, classify it and (for Sino-Korean compounds) break it into its hanja morphemes with short English glosses.
Be conservative: if you are not fully certain of the hanja for a word, return kind "unsure" instead of guessing.
Particles/suffixes that are native (like 하다, 스럽다, 어치) are not hanja morphemes — a word like 공부하다 is sino with parts 공+부 only if the stem is Sino-Korean; glosses describe the hanja meaning, not the whole word.

Words (korean — english meaning):
${batch.map((w) => `${w.korean} — ${w.meaning_en}`).join("\n")}`;

    const res = await callGemini(prompt, `batch ${bi}`);
    if (!res) {
      console.error(`batch ${bi}: all models exhausted — rerun the script to resume`);
      return;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error(`batch ${bi}: empty response, skipping`);
      continue;
    }
    let parsed: Note[];
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error(`batch ${bi}: bad JSON, skipping`);
      continue;
    }
    const wanted = new Set(batch.map((w) => w.korean));
    let added = 0;
    for (const n of parsed) {
      if (!wanted.has(n.korean)) continue;
      const line = render(n);
      // Store "" for native/unsure so reruns don't re-ask about them.
      notes[n.korean] = line ?? "";
      added++;
    }
    writeFileSync(OUT, JSON.stringify(notes, null, 0));
    console.log(`batch ${++done}/${batches.length}: +${added}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const withNote = Object.values(notes).filter(Boolean).length;
console.log(`DONE: ${Object.keys(notes).length} analyzed, ${withNote} with a note`);
