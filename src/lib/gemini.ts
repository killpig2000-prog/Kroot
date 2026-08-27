// Shared Gemini grading call — was duplicated between
// api/writing/grade/route.ts and api/level-test/grade/route.ts (same fetch,
// same response-text extraction, same JSON.parse/error handling).
export type GeminiGradeOutcome<T> =
  | { ok: true; result: T }
  | { ok: false; status: number; error: string; message?: string };

export async function gradeWithGemini<T>(opts: {
  apiKey: string;
  prompt: string;
  responseSchema: object;
  model?: string;
}): Promise<GeminiGradeOutcome<T>> {
  const model = opts.model ?? "gemini-flash-latest";

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

  if (!geminiRes.ok) return { ok: false, status: 502, error: "grading_failed" };

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
