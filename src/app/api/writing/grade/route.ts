import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { gradeWithGemini } from "@/lib/gemini";
import { utcDayStartISO } from "@/lib/writing";

// All grading is unlimited now (free for everyone).

export type GradeResult = {
  score: number; // 0-100 grammar accuracy
  feedback_en: string; // short encouraging feedback in English
  corrected_kr: string; // corrected version of the learner's Korean (same text if already correct)
  /** Plus only: sentence-by-sentence corrections. */
  corrections?: { original: string; corrected: string; note: string }[];
};

// Google AI Studio free-tier key (https://aistudio.google.com/apikey).
const GEMINI_MODEL = "gemini-flash-latest";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER", description: "Grammar accuracy 0-100. 100 = perfectly natural." },
    feedback_en: {
      type: "STRING",
      description:
        "One or two short, warm, encouraging sentences in simple English explaining the main grammar points.",
    },
    corrected_kr: {
      type: "STRING",
      description:
        "The learner's answer rewritten as natural, correct Korean. Unchanged if already correct.",
    },
  },
  required: ["score", "feedback_en", "corrected_kr"],
};

// Plus gets sentence-by-sentence corrections on top of the base grading.
const PLUS_RESPONSE_SCHEMA = {
  ...RESPONSE_SCHEMA,
  properties: {
    ...RESPONSE_SCHEMA.properties,
    corrections: {
      type: "ARRAY",
      description:
        "One entry per sentence in the learner's answer. Sentences that are already correct get corrected = original and a short praise note.",
      items: {
        type: "OBJECT",
        properties: {
          original: { type: "STRING", description: "The learner's sentence, verbatim." },
          corrected: { type: "STRING", description: "The natural, correct version." },
          note: {
            type: "STRING",
            description: "One short English sentence naming the grammar point that changed.",
          },
        },
        required: ["original", "corrected", "note"],
      },
    },
  },
  required: [...RESPONSE_SCHEMA.required, "corrections"],
};

const MAX_RESPONSE_CHARS = 2000;
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

  const { prompt_kr, prompt_en, prompt_key, response_text, level, stimulus_kr } = await request.json();
  if (typeof response_text !== "string" || !response_text.trim()) {
    return NextResponse.json({ error: "empty_response" }, { status: 400 });
  }
  if (response_text.length > MAX_RESPONSE_CHARS) {
    return NextResponse.json(
      {
        error: "response_too_long",
        message: `Your answer is too long (${response_text.length} characters). Please keep it under ${MAX_RESPONSE_CHARS}.`,
      },
      { status: 400 }
    );
  }

  // Daily limit: 5 grading requests per user per UTC day.
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

  const outcome = await gradeWithGemini<GradeResult>({
    apiKey,
    model: GEMINI_MODEL,
    responseSchema: PLUS_RESPONSE_SCHEMA,
    prompt: `You are a kind Korean teacher grading a short writing exercise from a CEFR ${level} learner.

Writing prompt (Korean): ${prompt_kr}
Writing prompt (English): ${prompt_en}${
      typeof stimulus_kr === "string" && stimulus_kr.trim()
        ? `\n\nThe learner is replying to this message they received:\n${stimulus_kr}`
        : ""
    }

Learner's answer:
${response_text}

Grade the grammar accuracy relative to their ${level} level (don't punish vocabulary simplicity — only grammar, particles, conjugation, word order, and spelling). Be encouraging.

Also return sentence-by-sentence corrections: one entry per sentence of the learner's answer, each with the original, the corrected version, and a one-line note on the grammar point.`,
  });

  if (!outcome.ok) {
    return NextResponse.json(
      outcome.message ? { error: outcome.error, message: outcome.message } : { error: outcome.error },
      { status: outcome.status }
    );
  }
  const result = outcome.result;
  result.score = Math.max(0, Math.min(100, Number(result.score) || 0));

  // Log this grading attempt (best-effort, don't fail if it errors).
  await supabase.from("ai_grade_log").insert({ user_id: user.id }).catch(() => {});

  return NextResponse.json(result);
}
