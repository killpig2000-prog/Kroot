import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// AI grading for the free-response parts of a promotion test (writing +
// speaking transcript). Same Gemini setup as /api/writing/grade.

export type PromotionGradeResult = {
  score: number; // 0-100 for the target level
  feedback_en: string;
};

const GEMINI_MODEL = "gemini-flash-latest";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    score: {
      type: "INTEGER",
      description: "0-100: how convincingly this answer demonstrates the target CEFR level.",
    },
    feedback_en: {
      type: "STRING",
      description: "Two short sentences in simple English: one strength, one thing to improve.",
    },
  },
  required: ["score", "feedback_en"],
};

const MAX_CHARS = 1500;
const RATE_LIMIT = 6;
const RATE_WINDOW_MS = 60_000;
const recentRequests = new Map<string, number[]>();

function isRateLimited(userId: string) {
  const now = Date.now();
  const hits = (recentRequests.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) return true;
  hits.push(now);
  recentRequests.set(userId, hits);
  return false;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "grading_unavailable" }, { status: 503 });

  const { kind, prompt, answer, from_level, to_level } = await request.json();
  if (kind !== "writing" && kind !== "speaking") {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }
  if (typeof answer !== "string" || !answer.trim()) {
    return NextResponse.json({ error: "empty_response" }, { status: 400 });
  }
  if (answer.length > MAX_CHARS) {
    return NextResponse.json({ error: "response_too_long" }, { status: 400 });
  }

  const speakingNote =
    kind === "speaking"
      ? "\nThe answer is a speech-recognition transcript, so ignore missing punctuation and minor transcription artifacts — judge vocabulary, grammar, and sentence structure."
      : "";

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
                text: `You are grading one ${kind} answer in a Korean promotion test. The learner is currently CEFR ${from_level} and wants to prove they are ready for ${to_level}.

Task given to the learner: ${prompt}

Learner's answer:
${answer}
${speakingNote}
Score 0-100: 100 = clearly ready for ${to_level}; 60 = borderline; below 40 = not yet. Judge grammar, task completion, and sentence variety expected at ${to_level}. An empty, off-task, or non-Korean answer scores below 20.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  );

  if (!geminiRes.ok) return NextResponse.json({ error: "grading_failed" }, { status: 502 });
  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ error: "grading_failed" }, { status: 502 });

  let result: PromotionGradeResult;
  try {
    result = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "grading_failed" }, { status: 502 });
  }
  result.score = Math.max(0, Math.min(100, Number(result.score) || 0));
  return NextResponse.json(result);
}
