import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { gradeWithGemini } from "@/lib/gemini";
import { utcDayStartISO } from "@/lib/writing";

// All grading is unlimited feature-wise now (free for everyone) — capped by
// GRADE_LIMIT_PER_DAY below purely to manage the Gemini API cost.

export type ChapterGradeResult = {
  score: number; // 0-100 average across all answers in the chapter
  feedback_en: string; // one warm sentence summarizing the whole chapter
  answers: {
    index: number; // 0-indexed position within the chapter
    score: number; // 0-100 for this answer
    original: string; // learner's answer, verbatim
    corrected: string; // natural, correct version (same as original if already correct)
    note: string; // one short grammar-point explanation
  }[];
  commonPatterns: {
    label: string; // short name of the pattern, e.g. "Missing object particle"
    detail: string; // one sentence explaining it
    count: number; // how many answers in this chapter showed it
  }[];
  learningPoint: {
    headline: string; // the one thing to focus on next, phrased as advice
    example_kr?: string; // a short natural example demonstrating it
  };
};

type ChapterAnswerInput = {
  prompt_kr: string;
  prompt_en: string;
  stimulus_kr?: string;
  response_text: string;
};

const GEMINI_MODEL = "gemini-flash-latest";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER", description: "Average grammar accuracy 0-100 across all answers." },
    feedback_en: {
      type: "STRING",
      description: "One warm, encouraging sentence in simple English summarizing the whole chapter.",
    },
    answers: {
      type: "ARRAY",
      description: "One entry per answer, in the same order they were given.",
      items: {
        type: "OBJECT",
        properties: {
          index: { type: "INTEGER", description: "0-indexed position of this answer." },
          score: { type: "INTEGER", description: "Grammar accuracy 0-100 for this answer alone." },
          original: { type: "STRING", description: "The learner's answer, verbatim." },
          corrected: { type: "STRING", description: "The natural, correct version. Same as original if already correct." },
          note: { type: "STRING", description: "One short English sentence naming the grammar point." },
        },
        required: ["index", "score", "original", "corrected", "note"],
      },
    },
    commonPatterns: {
      type: "ARRAY",
      description: "0-2 mistake patterns that repeat across two or more answers. Empty array if none repeat.",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Short name of the pattern, e.g. 'Missing object particle'." },
          detail: { type: "STRING", description: "One sentence explaining the pattern in simple English." },
          count: { type: "INTEGER", description: "How many of the answers show this pattern." },
        },
        required: ["label", "detail", "count"],
      },
    },
    learningPoint: {
      type: "OBJECT",
      description: "The single most useful thing to practice next, based on this chapter.",
      properties: {
        headline: { type: "STRING", description: "One short, actionable sentence of advice." },
        example_kr: { type: "STRING", description: "A short natural Korean example demonstrating it. Optional." },
      },
      required: ["headline"],
    },
  },
  required: ["score", "feedback_en", "answers", "commonPatterns", "learningPoint"],
};

const MAX_RESPONSE_CHARS = 500;
const MAX_ANSWERS = 6;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const GRADE_LIMIT_PER_DAY = 5;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (isRateLimited("writing-grade", user.id, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many grading requests. Please wait a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "grading_unavailable" }, { status: 503 });
  }

  const body = await request.json();
  const { level, answers } = body as { level?: string; answers?: ChapterAnswerInput[] };

  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) {
    return NextResponse.json({ error: "invalid_answers" }, { status: 400 });
  }
  for (const a of answers) {
    if (typeof a.response_text !== "string" || !a.response_text.trim()) {
      return NextResponse.json({ error: "empty_response" }, { status: 400 });
    }
    if (a.response_text.length > MAX_RESPONSE_CHARS) {
      return NextResponse.json(
        {
          error: "response_too_long",
          message: `One of your answers is too long (${a.response_text.length} characters). Please keep each under ${MAX_RESPONSE_CHARS}.`,
        },
        { status: 400 }
      );
    }
  }

  // Daily limit: 5 grading requests (one per chapter) per user per UTC day.
  const dayStart = utcDayStartISO();
  const { count, error: countError } = await supabase
    .from("ai_grade_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", dayStart);

  if (!countError && (count ?? 0) >= GRADE_LIMIT_PER_DAY) {
    return NextResponse.json(
      {
        error: "daily_limit",
        message: "서비스 점검중입니다. 내일 다시 시도해주세요.",
      },
      { status: 429 }
    );
  }

  const answersBlock = answers
    .map((a, i) => {
      const stimulus =
        typeof a.stimulus_kr === "string" && a.stimulus_kr.trim()
          ? `\n(The learner is replying to this message: ${a.stimulus_kr})`
          : "";
      return `--- Answer ${i} ---
Prompt (Korean): ${a.prompt_kr}
Prompt (English): ${a.prompt_en}${stimulus}
Learner's answer: ${a.response_text.trim()}`;
    })
    .join("\n\n");

  const outcome = await gradeWithGemini<ChapterGradeResult>({
    apiKey,
    model: GEMINI_MODEL,
    responseSchema: RESPONSE_SCHEMA,
    prompt: `You are a kind Korean teacher grading a chapter of writing answers from a CEFR ${level ?? ""} learner. The chapter has ${answers.length} separate short-answer questions; grade each one, then look across all of them together.

${answersBlock}

INSTRUCTIONS:
1. For each answer (in order, index 0 to ${answers.length - 1}), give a 0-100 grammar accuracy score, the corrected natural version, and one short note.
2. Calculate an overall score as the average across all answers.
3. Look across ALL answers together and identify 0-2 patterns: mistakes that repeat in two or more answers. If nothing repeats, return an empty array — do not force a pattern.
4. Pick ONE key learning point for the whole chapter: the single most useful thing to practice next. Make it actionable, and include a short natural example if it helps.

⚠️ IMPORTANT: Do NOT change the content or meaning of any answer. Only fix grammar, particles, conjugation, word order, and spelling. The learner's intended message must stay the same.

Grade relative to CEFR ${level ?? ""} — don't punish simple vocabulary, only grammar, particles, conjugation, word order, and spelling.

Be warm and encouraging. Praise answers that are already correct.`,
  });

  if (!outcome.ok) {
    return NextResponse.json(
      outcome.message ? { error: outcome.error, message: outcome.message } : { error: outcome.error },
      { status: outcome.status }
    );
  }
  const result = outcome.result;
  result.score = Math.max(0, Math.min(100, Number(result.score) || 0));
  result.answers = (result.answers ?? [])
    .map((a) => ({ ...a, score: Math.max(0, Math.min(100, Number(a.score) || 0)) }))
    .sort((a, b) => a.index - b.index);

  // Log this grading attempt (best-effort, don't fail if it errors).
  try {
    await supabase.from("ai_grade_log").insert({ user_id: user.id });
  } catch {
    // best-effort
  }

  return NextResponse.json(result);
}
