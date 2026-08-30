// Generate an English rendering of every writing prompt's model answer
// (example_kr). The tap-to-assemble Writing modes show this English line as
// the sentence to build, so it must be a faithful, natural translation of
// example_kr — not of the prompt.
//
// Output: src/lib/writing-example-en.json, keyed by "{level}:{example_kr}"
// (prompt_kr repeats across reply prompts, example_kr does not) -> example_en. Applied as a
// load-time overlay in src/lib/writing.ts; the data files are never touched.
// Re-runnable: prompts that already have an entry are skipped.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/gen-writing-example-en.mts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { DAILY_LIFE_PROMPTS } from "@/lib/writing-data/daily-life";

const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
let modelIndex = 0;
const BATCH = 40;
const CONCURRENCY = 3;
const OUT = new URL("../src/lib/writing-example-en.json", import.meta.url);

const apiKey = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .match(/GEMINI_API_KEY=(.+)/)![1]
  .trim();

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      id: { type: "STRING", description: "copied verbatim from the input" },
      en: { type: "STRING", description: "natural English translation of kr" },
    },
    required: ["id", "en"],
  },
};

const out: Record<string, string> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

const todo = DAILY_LIFE_PROMPTS.map((p, i) => ({
  id: String(i),
  key: `${p.level}:${p.example_kr}`,
  kr: p.example_kr,
  level: p.level,
})).filter((t) => !out[t.key]);

console.log(`${todo.length} prompts need example_en (${Object.keys(out).length} already done)`);

async function callGemini(batch: typeof todo): Promise<{ id: string; en: string }[]> {
  const prompt = `Translate each Korean sentence (a model answer written by a Korean learner at the given CEFR level) into natural, plain English.
Rules:
- Translate the meaning faithfully, sentence for sentence — keep the same number of sentences and the same order.
- First person stays first person ("I", "my"). Keep it simple and literal enough that a learner could map each English clause back to the Korean.
- No explanations, no romanization, no Korean in the output.
Return a JSON array with one {id, en} per input, ids copied verbatim.

Input:
${JSON.stringify(batch.map((t) => ({ id: t.id, level: t.level, kr: t.kr })), null, 0)}`;

  for (let attempt = 0; attempt < 4; attempt++) {
    const model = MODELS[modelIndex % MODELS.length];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0.2 },
        }),
      }
    );
    if (res.status === 429 || res.status >= 500) {
      modelIndex++;
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`${model} ${res.status} ${await res.text()}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("empty response");
    return JSON.parse(text);
  }
  throw new Error("gave up after retries");
}

const batches: (typeof todo)[] = [];
for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));

let done = 0;
async function worker() {
  while (batches.length) {
    const batch = batches.shift()!;
    try {
      const rows = await callGemini(batch);
      const byId = new Map(rows.map((r) => [r.id, r.en]));
      for (const t of batch) {
        const en = byId.get(t.id)?.trim();
        if (en) out[t.key] = en;
        else console.warn("missing", t.key);
      }
      done += batch.length;
      writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
      console.log(`${done}/${todo.length}`);
    } catch (e) {
      console.error("batch failed:", (e as Error).message);
      batches.push(batch);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`done — ${Object.keys(out).length} entries in ${OUT.pathname}`);
