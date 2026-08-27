// Regenerate vocab example sentences so their GRAMMAR complexity actually
// matches the word's CEFR level — word difficulty already scales A1->C2,
// but every example sentence was hand-authored in the same flat 어요/예요
// present-tense template regardless of level (e.g. the C2 word 진퇴양난
// got "저는 진퇴양난에 빠졌어요", no different from an A1 sentence).
// example_kr also doubles as the fill-in-the-blank quiz sentence for B1+
// (see quizModeForLevel in src/lib/vocabulary.ts), so this affects quiz
// difficulty too, not just the flashcard.
//
// Output: src/lib/vocabulary-data/example-overrides.json, keyed by
// "{level}:{korean}" -> { example_kr, example_en }. Applied as an overlay
// at load time (src/lib/vocabulary.ts) — never mutates the source .ts
// word-list files. Re-runnable: already-generated words are skipped.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/gen-vocab-examples.mts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { DAILY_LIFE_WORDS } from "@/lib/vocabulary-data/daily-life";
import { GRAMMAR_LESSONS } from "@/lib/grammar";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

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
const BATCH = 25;
const CONCURRENCY = 3;
const OUT = new URL("../src/lib/vocabulary-data/example-overrides.json", import.meta.url);

const apiKey = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .match(/GEMINI_API_KEY=(.+)/)![1]
  .trim();

// CEFR is cumulative — a B1 learner still knows every A1/A2 pattern, so the
// "grammar available" list for a level includes every lesson up to and
// including it, not just that level's own lessons.
function grammarContextFor(level: CefrLevel): string {
  const levels = LEVEL_ORDER.slice(0, LEVEL_ORDER.indexOf(level) + 1);
  return GRAMMAR_LESSONS.filter((l) => levels.includes(l.level))
    .map((l) => `${l.level} ${l.title}`)
    .join("; ");
}

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      korean: { type: "STRING", description: "the target word, copied verbatim from the input" },
      example_kr: { type: "STRING", description: "one natural Korean sentence using the word" },
      example_en: { type: "STRING", description: "its English translation" },
    },
    required: ["korean", "example_kr", "example_en"],
  },
};

type Override = { example_kr: string; example_en: string };

const overrides: Record<string, Override> = existsSync(OUT)
  ? JSON.parse(readFileSync(OUT, "utf8"))
  : {};

const words = DAILY_LIFE_WORDS.filter((w) => !(`${w.level}:${w.korean}` in overrides));
console.log(`to regenerate: ${words.length} words (${Object.keys(overrides).length} already done)`);

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
            temperature: 0.6,
          },
        }),
      }
    ).catch(() => null);
    if (res?.ok) return res;
    if (!res) {
      if (++transient > 10) return null;
      continue;
    }
    if (res.status === 429) {
      if (modelIndex === idx) {
        modelIndex++;
        console.error(`${tag}: 429 on ${model}, switching to ${MODELS[modelIndex] ?? "(none left)"}`);
      }
      transient = 0;
      continue;
    }
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

// Group by level so one batch shares one grammar-context block in the prompt.
const byLevel = new Map<CefrLevel, typeof words>();
for (const w of words) {
  if (!byLevel.has(w.level)) byLevel.set(w.level, []);
  byLevel.get(w.level)!.push(w);
}

const batches: { level: CefrLevel; items: typeof words }[] = [];
for (const [level, items] of byLevel) {
  for (let i = 0; i < items.length; i += BATCH) {
    batches.push({ level, items: items.slice(i, i + BATCH) });
  }
}

let nextBatch = 0;
let done = 0;

async function worker(): Promise<void> {
  for (;;) {
    const bi = nextBatch++;
    if (bi >= batches.length) return;
    const { level, items } = batches[bi];
    const grammar = grammarContextFor(level);
    const prompt = `You are writing example sentences for a Korean vocabulary deck aimed at English-speaking learners at CEFR ${level}.

Grammar points this learner has studied so far (cumulative through ${level}): ${grammar}.

For each word below, write ONE natural Korean sentence that uses the word, with sentence complexity and register genuinely typical of CEFR ${level} — not simpler than what a ${level} learner is ready for, and not exceeding the grammar list above. Higher levels (B2+) should read as more sophisticated, longer, or more formal than A1/A2 sentences, not just the same simple template with a harder word swapped in. Include a natural English translation.

Words (korean — english meaning):
${items.map((w) => `${w.korean} — ${w.meaning_en}`).join("\n")}`;

    const res = await callGemini(prompt, `batch ${bi} (${level})`);
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
    let parsed: { korean: string; example_kr: string; example_en: string }[];
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error(`batch ${bi}: bad JSON, skipping`);
      continue;
    }
    const wanted = new Set(items.map((w) => w.korean));
    let added = 0;
    for (const p of parsed) {
      if (!wanted.has(p.korean) || !p.example_kr || !p.example_en) continue;
      overrides[`${level}:${p.korean}`] = { example_kr: p.example_kr, example_en: p.example_en };
      added++;
    }
    writeFileSync(OUT, JSON.stringify(overrides, null, 0));
    console.log(`batch ${++done}/${batches.length} (${level}): +${added}`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`DONE: ${Object.keys(overrides).length}/${DAILY_LIFE_WORDS.length} words regenerated`);
