// Pre-generate the whole Korean content library with Edge TTS and fill the
// public `tts` cache bucket, so every in-app play is an instant cache hit.
//
// Usage: npx tsx --tsconfig tsconfig.json scripts/pregen-tts.mts
// Auth: reads scripts/.pregen-auth (two lines: email, password) for a normal
// app account — the bucket policy allows authenticated inserts. Re-runnable:
// clips already in the bucket are skipped.
import { createHash } from "crypto";
import { readFileSync, appendFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { sanitizeKorean } from "@/lib/tts";

const ENGINE = "edge-tts";
const VOICES = { f: "ko-KR-SunHiNeural", m: "ko-KR-InJoonNeural" } as const;
const MAX_CHARS = 300;
const CONCURRENCY = 4;

// Mirrors JAMO_SOUND in src/lib/tts.ts (not exported there).
const JAMO: Record<string, string> = {
  "ㅏ": "아", "ㅑ": "야", "ㅓ": "어", "ㅕ": "여", "ㅗ": "오", "ㅛ": "요",
  "ㅜ": "우", "ㅠ": "유", "ㅡ": "으", "ㅣ": "이", "ㅐ": "애", "ㅒ": "얘",
  "ㅔ": "에", "ㅖ": "예", "ㅘ": "와", "ㅙ": "왜", "ㅚ": "외", "ㅝ": "워",
  "ㅞ": "웨", "ㅟ": "위", "ㅢ": "의",
  "ㄱ": "그", "ㄴ": "느", "ㄷ": "드", "ㄹ": "르", "ㅁ": "므", "ㅂ": "브",
  "ㅅ": "스", "ㅇ": "으", "ㅈ": "즈", "ㅊ": "츠", "ㅋ": "크", "ㅌ": "트",
  "ㅍ": "프", "ㅎ": "흐", "ㄲ": "끄", "ㄸ": "뜨", "ㅃ": "쁘", "ㅆ": "쓰",
  "ㅉ": "쯔",
};

const MODULES = [
  "@/lib/community", "@/lib/course", "@/lib/grammar", "@/lib/hangul",
  "@/lib/level-test", "@/lib/listening-dialogues", "@/lib/listening",
  "@/lib/promotion-test", "@/lib/pronunciation", "@/lib/reading-data/daily-life",
  "@/lib/slang", "@/lib/speaking", "@/lib/themes", "@/lib/tree",
  "@/lib/vocabulary", "@/lib/writing-data/daily-life",
];

type Job = { spoken: string; voice: "f" | "m" };
const jobs = new Map<string, Job>();

function add(raw: string, voice: "f" | "m") {
  const clean = sanitizeKorean(raw);
  const spoken = JAMO[clean] ?? clean;
  if (!/[가-힣]/.test(spoken) || spoken.length > MAX_CHARS) return;
  jobs.set(`${voice}|${spoken}`, { spoken, voice });
}

function isDialogue(a: unknown[]): a is { speaker: string; kr: string }[] {
  return (
    a.length > 0 &&
    a.every(
      (x) =>
        !!x && typeof x === "object" &&
        typeof (x as Record<string, unknown>).speaker === "string" &&
        typeof (x as Record<string, unknown>).kr === "string"
    )
  );
}

function walk(v: unknown, seen: Set<unknown>) {
  if (typeof v === "string") return add(v, "f");
  if (!v || typeof v !== "object" || seen.has(v)) return;
  seen.add(v);
  if (Array.isArray(v)) {
    if (isDialogue(v)) {
      // Same speaker→voice mapping as useSpeechSynthesis.
      const speakers = Array.from(new Set(v.map((l) => l.speaker)));
      for (const line of v) add(line.kr, speakers.indexOf(line.speaker) % 2 === 0 ? "f" : "m");
    }
    for (const item of v) walk(item, seen);
    return;
  }
  for (const val of Object.values(v)) walk(val, seen);
}

const seen = new Set<unknown>();
for (const mod of MODULES) walk(await import(mod), seen);

// Every syllable the hangul SyllableBuilder can compose (all cho × jung,
// no batchim), plus the spoken name used for ㅇ.
for (let cho = 0; cho < 19; cho++)
  for (let jung = 0; jung < 21; jung++)
    add(String.fromCharCode(0xac00 + cho * 588 + jung * 28), "f");
add("이응", "f");
for (const syl of Object.values(JAMO)) add(syl, "f");

console.log(`collected ${jobs.size} unique clips`);

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)![1].trim();
const anon = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)![1].trim();
const [email, password] = readFileSync(new URL(".pregen-auth", import.meta.url), "utf8")
  .trim()
  .split("\n")
  .map((s) => s.trim());

const supabase = createClient(url, anon);
const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) throw new Error(`sign-in failed: ${authError.message}`);

// Skip clips already in the bucket (resumable across runs).
const existing = new Set<string>();
for (let offset = 0; ; offset += 1000) {
  const { data, error } = await supabase.storage.from("tts").list("", { limit: 1000, offset });
  if (error) throw new Error(`list failed: ${error.message}`);
  for (const f of data) existing.add(f.name);
  if (data.length < 1000) break;
}
console.log(`bucket already has ${existing.size} files`);

const queue = [...jobs.values()].filter(({ spoken, voice }) => {
  const hash = createHash("sha256").update(`${ENGINE}|${voice}|${spoken}`).digest("hex");
  return !existing.has(`${hash}.mp3`);
});
console.log(`to generate: ${queue.length}`);

let done = 0;
let failed = 0;

async function synth(text: string, voice: "f" | "m"): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICES[voice], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];
  for await (const c of audioStream) chunks.push(c as Buffer);
  const buf = Buffer.concat(chunks);
  if (buf.length === 0) throw new Error("empty audio");
  return buf;
}

async function worker() {
  for (;;) {
    const job = queue.pop();
    if (!job) return;
    const hash = createHash("sha256").update(`${ENGINE}|${job.voice}|${job.spoken}`).digest("hex");
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      try {
        const buf = await synth(job.spoken, job.voice);
        const { error } = await supabase.storage
          .from("tts")
          .upload(`${hash}.mp3`, buf, { contentType: "audio/mpeg", cacheControl: "31536000", upsert: true });
        if (error) throw new Error(error.message);
        ok = true;
      } catch {
        if (attempt === 2) {
          failed++;
          appendFileSync("pregen-failed.txt", `${job.voice}|${job.spoken}\n`);
        } else {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
      }
    }
    done++;
    if (done % 100 === 0) console.log(`progress ${done}/${done + queue.length}, failed ${failed}`);
    await new Promise((r) => setTimeout(r, 150));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`DONE: ${done} processed, ${failed} failed`);
