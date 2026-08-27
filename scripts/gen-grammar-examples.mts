// Add more example sentences to each grammar concept section — most
// sections only had 2-3 hand-authored examples, thin for a language
// learner who needs to see a pattern repeated across several contexts to
// internalize it.
//
// Output: src/lib/grammar-example-overrides.json, keyed by
// "{lessonKey}:{sectionIndex}" -> extra GrammarExample[] to APPEND after
// the existing ones (never replaces them). Applied as a load-time overlay
// in src/lib/grammar.ts — the RAW_LESSONS source array is never touched.
// Re-runnable: sections already at/above the target count are skipped.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/gen-grammar-examples.mts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { GRAMMAR_LESSONS, type GrammarExample } from "@/lib/grammar";

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
const TARGET_PER_SECTION = 6;
const BATCH = 8; // sections per request — each needs several examples back
const CONCURRENCY = 3;
const OUT = new URL("../src/lib/grammar-example-overrides.json", import.meta.url);

const apiKey = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .match(/GEMINI_API_KEY=(.+)/)![1]
  .trim();

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      id: { type: "STRING", description: "the section id, copied verbatim from the input" },
      examples: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            kr: { type: "STRING" },
            romanization: { type: "STRING", description: "revised romanization (McCune-Reischauer style, matching the existing examples)" },
            en: { type: "STRING" },
          },
          required: ["kr", "romanization", "en"],
        },
      },
    },
    required: ["id", "examples"],
  },
};

type Override = GrammarExample[];
const overrides: Record<string, Override> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

type Task = {
  id: string;
  lessonKey: string;
  lessonTitle: string;
  level: string;
  heading: string;
  explanation: string;
  existing: GrammarExample[];
  need: number;
};

const tasks: Task[] = [];
for (const lesson of GRAMMAR_LESSONS) {
  // GRAMMAR_LESSONS already has any prior overrides merged into
  // section.examples (see withExtraExamples in src/lib/grammar.ts) — don't
  // double-count them against the overrides map too.
  lesson.sections.forEach((section, i) => {
    const id = `${lesson.key}:${i}`;
    const need = TARGET_PER_SECTION - section.examples.length;
    if (need <= 0) return;
    tasks.push({
      id,
      lessonKey: lesson.key,
      lessonTitle: lesson.title,
      level: lesson.level,
      heading: section.heading,
      explanation: section.explanation,
      existing: section.examples,
      need,
    });
  });
}
console.log(`to fill: ${tasks.length} sections (target ${TARGET_PER_SECTION} examples each)`);

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
            temperature: 0.7,
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

const batches: Task[][] = [];
for (let i = 0; i < tasks.length; i += BATCH) batches.push(tasks.slice(i, i + BATCH));

let nextBatch = 0;
let done = 0;

async function worker(): Promise<void> {
  for (;;) {
    const bi = nextBatch++;
    if (bi >= batches.length) return;
    const batch = batches[bi];

    const prompt = `You are writing extra example sentences for a Korean grammar textbook aimed at English-speaking learners.

For each grammar point below, write ADDITIONAL natural Korean example sentences (do not repeat any of the "already have" sentences, and don't just swap one word in them — vary the subject, context, and vocabulary). Each sentence must clearly demonstrate the grammar point being explained, at a sentence complexity appropriate for CEFR ${batch[0]?.level ?? ""}-ish level (match each item's own level below). Give a romanization in the same style as the existing examples (McCune-Reischauer-ish, lowercase, hyphenated syllables) and a natural English translation.

${batch
  .map(
    (t) => `--- id: ${t.id} (lesson: ${t.lessonTitle}, level ${t.level}) ---
Grammar point: ${t.heading}
Explanation: ${t.explanation}
Already have: ${t.existing.map((e) => e.kr).join(" / ")}
Write ${t.need} new example(s).`
  )
  .join("\n\n")}`;

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
    let parsed: { id: string; examples: GrammarExample[] }[];
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error(`batch ${bi}: bad JSON, skipping`);
      continue;
    }
    const wanted = new Set(batch.map((t) => t.id));
    let added = 0;
    for (const p of parsed) {
      if (!wanted.has(p.id) || !Array.isArray(p.examples)) continue;
      const clean = p.examples.filter((e) => e.kr && e.romanization && e.en);
      overrides[p.id] = [...(overrides[p.id] ?? []), ...clean];
      added += clean.length;
    }
    writeFileSync(OUT, JSON.stringify(overrides, null, 0));
    console.log(`batch ${++done}/${batches.length}: +${added} examples`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`DONE: ${Object.values(overrides).reduce((n, arr) => n + arr.length, 0)} extra examples generated`);
