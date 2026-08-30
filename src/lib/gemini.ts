// Shared Gemini grading call — was duplicated between
// api/writing/grade/route.ts and api/level-test/grade/route.ts (same fetch,
// same response-text extraction, same JSON.parse/error handling).
export type GeminiGradeOutcome<T> =
  | { ok: true; result: T }
  | { ok: false; status: number; error: string; message?: string };

/** When the primary model is overloaded (503) or rate-limited (429), try this one before giving up. */
const FALLBACK_MODEL = "gemini-flash-lite-latest";

export async function gradeWithGemini<T>(opts: {
  apiKey: string;
  prompt: string;
  responseSchema: object;
  model?: string;
}): Promise<GeminiGradeOutcome<T>> {
  const primary = opts.model ?? "gemini-flash-latest";
  const first = await callModel<T>(primary, opts);
  if (first.ok || !first.retryable || primary === FALLBACK_MODEL) return first;
  return callModel<T>(FALLBACK_MODEL, opts);
}

async function callModel<T>(
  model: string,
  opts: { apiKey: string; prompt: string; responseSchema: object }
): Promise<GeminiGradeOutcome<T> & { retryable?: boolean }> {

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${opts.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: opts.responseSchema,
        },
      }),
    }
  );

  if (!geminiRes.ok) {
    // Surface the upstream reason (429 quota, 503 overloaded, 400 schema) —
    // the client only ever sees a bare 502.
    console.error(`gemini ${model} ${geminiRes.status}:`, (await geminiRes.text().catch(() => "")).slice(0, 300));
    return { ok: false, status: 502, error: "grading_failed", retryable: geminiRes.status === 503 || geminiRes.status === 429 };
  }

  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { ok: false, status: 502, error: "grading_failed" };

  try {
    return { ok: true, result: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "grading_failed",
      message: "We couldn't read the grader's response. Please try again.",
    };
  }
}
