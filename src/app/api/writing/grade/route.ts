import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type GradeResult = {
  score: number; // 0-100 grammar accuracy
  feedback_en: string; // short encouraging feedback in English
  corrected_kr: string; // corrected version of the learner's Korean (same text if already correct)
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

const MAX_RESPONSE_CHARS = 2000;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

// Per-instance throttle; resets on cold start, which is acceptable as a cheap abuse brake.
const recentRequests = new Map<string, number[]>();

function isRateLimited(userId: string) {
  const now = Date.now();
  const hits = (recentRequests.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    recentRequests.set(userId, hits);
    return true;
  }
  hits.push(now);
  recentRequests.set(userId, hits);
  if (recentRequests.size > 5000) {
    for (const [key, times] of recentRequests) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) recentRequests.delete(key);
    }
  }
  return false;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many grading requests. Please wait a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "grading_unavailable" }, { status: 503 });
  }

  const { prompt_kr, prompt_en, response_text, level } = await request.json();
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

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a kind Korean teacher grading a short writing exercise from a CEFR ${level} learner.

Writing prompt (Korean): ${prompt_kr}
Writing prompt (English): ${prompt_en}

Learner's answer:
${response_text}

Grade the grammar accuracy relative to their ${level} level (don't punish vocabulary simplicity — only grammar, particles, conjugation, word order, and spelling). Be encouraging.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!geminiRes.ok) {
    return NextResponse.json({ error: "grading_failed" }, { status: 502 });
  }

  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: "grading_failed" }, { status: 502 });
  }

  let result: GradeResult;
  try {
    result = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "grading_failed", message: "We couldn't read the grader's response. Please try again." },
      { status: 502 }
    );
  }
  result.score = Math.max(0, Math.min(100, Number(result.score) || 0));
  return NextResponse.json(result);
}
