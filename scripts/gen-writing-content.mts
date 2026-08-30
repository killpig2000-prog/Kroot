// Regenerates every Writing prompt from scratch, one level+genre at a time.
// Replaces the old 40-per-genre/4-sentence content with 39-per-genre
// single-sentence answers whose length scales with CEFR level — the tap-
// -to-assemble board is tiles-only now, so a short answer is the point.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/gen-writing-content.mts [level ...]
//   (no args = all 6 levels; pass e.g. "A1 A2" to redo just those)
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"];
const PER_GENRE = 39;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
type Level = (typeof LEVELS)[number];
const GENRES = ["journal", "reply", "description", "opinion"] as const;
type Genre = (typeof GENRES)[number];

const apiKey = readFileSync(path.join(ROOT, ".env.local"), "utf8").match(/GEMINI_API_KEY=(.+)/)![1].trim();

// Complexity target per level — clause count and a rough word-count band,
// anchored to the examples the user gave: A1 "저는 밥을 먹어요.", A2 "저는
// 어제 바다에 갔어요.", B1 "저는 어제 친구랑 바다에 가서 고기를 먹었어요.".
const LEVEL_SPEC: Record<Level, string> = {
  A1: "Exactly ONE clause, 3-4 words, present or simple past 해요체. Example shape: 저는 밥을 먹어요.",
  A2: "Exactly ONE clause but with a time or place word added, 4-6 words, past tense 해요체. Example shape: 저는 어제 바다에 갔어요.",
  B1: "TWO clauses joined by a simple connector (-아서/어서, -고, -는데), 7-9 words total, past tense. Example shape: 저는 어제 친구랑 바다에 가서 고기를 먹었어요.",
  B2: "TWO or THREE clauses with a reason/manner/contrast connector, 9-11 words total, natural past-tense narration.",
  C1: "THREE clauses with a subordinate or opinion-flavored connector (-는데, -길래, -다 보니), 11-14 words, still natural spoken 해요체.",
  C2: "THREE or more clauses, sophisticated connectors and vocabulary, 13-16 words, reads like a fluent adult's diary/opinion entry.",
};

const GENRE_SPEC: Record<Genre, string> = {
  journal: `A diary entry. "prompt_kr" is a short everyday question about the learner's day (e.g. weather, meals, commute, hobbies, a small event) — NOT asking for multiple sentences, just "써 보세요"/"~했어요?" style. "example_kr" is the single natural sentence answering it. No "stimulus".`,
  reply: `A text-message reply. "stimulus_kr" is ONLY the raw Korean message a friend just sent (one short question, invitation, or small talk — no English, no extra commentary). "stimulus_en" is its English translation. "prompt_kr" is always exactly "친구의 메시지에 답장해 보세요." "example_kr" is a single natural one-sentence reply that directly answers stimulus_kr.`,
  description: `A description task. "prompt_kr" asks the learner to describe a person, place, object, food, or trend in one sentence. "example_kr" is that single descriptive sentence. No "stimulus".`,
  opinion: `An opinion task. "prompt_kr" asks for the learner's opinion or preference on an everyday topic (food, habits, weather, a small decision). "example_kr" is a single sentence stating that opinion. No "stimulus".`,
};

const RESPONSE_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      prompt_kr: { type: "STRING" },
      prompt_en: { type: "STRING" },
      stimulus_kr: { type: "STRING", description: "reply genre only; empty string otherwise" },
      stimulus_en: { type: "STRING", description: "reply genre only; empty string otherwise" },
      example_kr: { type: "STRING" },
      example_en: { type: "STRING" },
    },
    required: ["prompt_kr", "prompt_en", "example_kr", "example_en"],
  },
};

async function callGemini(level: Level, genre: Genre): Promise<
  { prompt_kr: string; prompt_en: string; stimulus_kr?: string; stimulus_en?: string; example_kr: string; example_en: string }[]
> {
  const prompt = `Generate ${PER_GENRE} DIFFERENT Korean-writing-practice items for a ${level}-level (CEFR) Korean learner.

Genre: ${genre}. ${GENRE_SPEC[genre]}

Sentence complexity for "example_kr" (every item must follow this, no exceptions):
${LEVEL_SPEC[level]}

Rules:
- example_kr is always exactly ONE sentence (one final period), never two.
- Cover ${PER_GENRE} clearly different everyday topics/situations — no repeats or near-duplicates.
- Natural, textbook-correct 해요체 Korean throughout (요 register), first person (저는) where relevant.
- Tense must agree with any time word: "어제"/"지난주" etc. require past tense (-았/었어요); "지금"/no time word defaults to present (-아/어요); never mix a past time word with a present-tense verb.
- example_kr must directly and sensibly answer prompt_kr (e.g. an opinion/preference question gets "좋아해요", not an unrelated action verb).
- prompt_en / stimulus_en / example_en are natural, simple English translations.
- prompt_kr must NOT ask for more than one sentence (no "두 문장으로", no "Write two sentences").
- For genres other than "reply", set stimulus_kr and stimulus_en to empty strings.

Return a JSON array of exactly ${PER_GENRE} items.`;

  const reqBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.9,
      maxOutputTokens: 65536,
    },
  });
  const bodyFile = path.join(os.tmpdir(), `gen-writing-${level}-${genre}-${process.pid}.json`);
  writeFileSync(bodyFile, reqBody);

  for (let attempt = 0; attempt < 14; attempt++) {
    const model = MODELS[attempt % MODELS.length];
    let stdout: string;
    try {
      // curl, not fetch — a hard process-level timeout (-m) that reliably
      // kills a stuck connection, unlike AbortController in this runtime.
      const r = await execFileAsync(
        "curl",
        [
          "-s",
          "-m",
          "150",
          "-w",
          "\\n%{http_code}",
          "-X",
          "POST",
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          "-H",
          "Content-Type: application/json",
          "--data-binary",
          `@${bodyFile}`,
        ],
        { maxBuffer: 64 * 1024 * 1024, timeout: 160_000 }
      );
      stdout = r.stdout;
    } catch (e) {
      console.log(`  ${level}/${genre} attempt ${attempt + 1} (${model}): curl failed — ${(e as Error).message.slice(0, 150)}`);
      continue;
    }
    const nl = stdout.lastIndexOf("\n");
    const httpCode = Number(stdout.slice(nl + 1).trim());
    const body = stdout.slice(0, nl);
    if (httpCode === 429 || httpCode >= 500) {
      console.log(`  ${level}/${genre} attempt ${attempt + 1} (${model}): HTTP ${httpCode}, retrying`);
      await new Promise((r) => setTimeout(r, Math.min(20000, 3000 * (attempt + 1))));
      continue;
    }
    if (httpCode !== 200) throw new Error(`${level}/${genre} ${httpCode} ${body.slice(0, 300)}`);
    let data: any;
    try {
      data = JSON.parse(body);
    } catch {
      console.log(`  ${level}/${genre} attempt ${attempt + 1} (${model}): malformed response envelope, retrying`);
      continue;
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = data?.candidates?.[0]?.finishReason;
    if (!text) {
      console.log(`  ${level}/${genre} attempt ${attempt + 1} (${model}): empty response (finish=${finishReason}), retrying`);
      continue;
    }
    let items: unknown;
    try {
      items = JSON.parse(text);
    } catch {
      console.log(`  ${level}/${genre} attempt ${attempt + 1} (${model}): malformed JSON (finish=${finishReason}, ${text.length} chars), retrying`);
      continue;
    }
    if (!Array.isArray(items) || items.length < PER_GENRE) {
      console.log(
        `  ${level}/${genre} attempt ${attempt + 1} (${model}): got ${Array.isArray(items) ? items.length : "?"} items (finish=${finishReason}), retrying`
      );
      continue;
    }
    return (items as Awaited<ReturnType<typeof callGemini>>).slice(0, PER_GENRE);
  }
  throw new Error(`${level}/${genre}: gave up after retries`);
}

// The model occasionally leaves an "(English translation)" parenthetical
// and a meta sentence like "친구의 메시지입니다..." inside stimulus_kr instead
// of using stimulus_en. Clean that up rather than re-prompting forever.
function cleanReplyItem<T extends { stimulus_kr?: string; stimulus_en?: string }>(it: T): T {
  if (!it.stimulus_kr) return it;
  let kr = it.stimulus_kr;
  const paren = kr.match(/\(([^)]+)\)/);
  const en = it.stimulus_en?.trim() || paren?.[1]?.trim() || "";
  kr = kr
    .replace(/\([^)]+\)/g, "")
    .replace(/친구의?\s*메시지(입니다)?\.?\s*답장을?\s*(써|해)\s*보세요\.?/g, "")
    .trim();
  return { ...it, stimulus_kr: kr, stimulus_en: en };
}

function toTsFile(level: Level, genre: Genre, items: Awaited<ReturnType<typeof callGemini>>): string {
  const constName = `WRITING_${level}_${genre.toUpperCase()}`;
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const rows = items
    .map((raw) => {
      const it = genre === "reply" ? cleanReplyItem(raw) : raw;
      const fields = [`level: "${level}"`, `genre: "${genre}"`];
      if (genre === "reply" && it.stimulus_kr) {
        fields.push(`stimulus_kr: "${esc(it.stimulus_kr)}"`, `stimulus_en: "${esc(it.stimulus_en ?? "")}"`);
      }
      fields.push(
        `prompt_kr: "${esc(it.prompt_kr)}"`,
        `prompt_en: "${esc(it.prompt_en)}"`,
        `example_kr: "${esc(it.example_kr)}"`,
        `example_en: "${esc(it.example_en)}"`
      );
      return `  {\n    ${fields.join(",\n    ")},\n  },`;
    })
    .join("\n");
  return `import type { RawPrompt } from "./types";\n\nexport const ${constName}: RawPrompt[] = [\n${rows}\n];\n`;
}

const argLevels = process.argv.slice(2).filter((a) => (LEVELS as readonly string[]).includes(a)) as Level[];
const levels = argLevels.length ? argLevels : [...LEVELS];
const argGenres = process.argv.slice(2).filter((a) => (GENRES as readonly string[]).includes(a)) as Genre[];
const genresToRun = argGenres.length ? argGenres : [...GENRES];
const FORCE = process.argv.includes("--force");

function alreadyDone(level: Level, genre: Genre): boolean {
  if (FORCE) return false;
  const file = path.join(ROOT, "src/lib/writing-data", `${level.toLowerCase()}-${genre}.ts`);
  try {
    const src = readFileSync(file, "utf8");
    return (src.match(/level:/g)?.length ?? 0) === PER_GENRE;
  } catch {
    return false;
  }
}

type Job = { level: Level; genre: Genre };
const queue: Job[] = [];
for (const level of levels) for (const genre of genresToRun) if (!alreadyDone(level, genre)) queue.push({ level, genre });
const total = queue.length;
console.log(`${total} job(s) to run (${levels.length * genresToRun.length - total} already done, skipped)`);

let done = 0;
async function worker() {
  while (queue.length) {
    const { level, genre } = queue.shift()!;
    let items;
    try {
      items = await callGemini(level, genre);
    } catch (e) {
      console.error(`FAILED ${level}/${genre}:`, (e as Error).message);
      continue;
    }
    const file = path.join(ROOT, "src/lib/writing-data", `${level.toLowerCase()}-${genre}.ts`);
    writeFileSync(file, toTsFile(level, genre, items));
    done++;
    console.log(`${done}/${total} ${level}/${genre} -> ${items.length} items`);
  }
}
await Promise.all(Array.from({ length: 2 }, worker));
console.log("done");
