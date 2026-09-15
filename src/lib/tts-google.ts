// Google Cloud Text-to-Speech (Chirp 3 HD), shared between /api/tts and
// scripts/pregen-tts.mts so the voice mapping can't drift between the two
// call sites.

const VOICE_NAMES = { f: "ko-KR-Chirp3-HD-Kore", m: "ko-KR-Chirp3-HD-Charon" } as const;
export const GOOGLE_VOICES = VOICE_NAMES;
export type GoogleVoiceKey = keyof typeof VOICE_NAMES;

// Chirp 3 HD reads a comma as barely a hitch — a listener hears "네," run
// straight into the next clause with no breath (2026-09-15, user: listening
// dialogue lines feel rushed at the comma). Plain `input.text` gives Google
// no say over that; wrapping the same text as SSML and inserting a real
// <break> after each comma does. Chirp 3 HD ignores most SSML (no
// <prosody>), but <break> works — confirmed against the API directly
// (a synthesized "네,<break time="400ms"/>알겠습니다." ran ~50% longer than
// the plain-text version).
const COMMA_BREAK = 250;
function toSsml(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const withBreaks = escaped.replace(/,/g, `,<break time="${COMMA_BREAK}ms"/>`);
  return `<speak>${withBreaks}</speak>`;
}

export async function synthesizeGoogle(
  text: string,
  voice: GoogleVoiceKey,
  { retries = 2 }: { retries?: number } = {},
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY not configured");

  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        input: text.includes(",") ? { ssml: toSsml(text) } : { text },
        voice: { languageCode: "ko-KR", name: VOICE_NAMES[voice] },
        // Chirp 3 HD synthesizes at 24 kHz (naturalSampleRateHertz). Asking for
        // 48 kHz doesn't add fidelity — the MP3 encoder still spends the same
        // ~32 kbps, just spread over twice the samples — so match the source.
        audioConfig: { audioEncoding: "MP3", sampleRateHertz: 24000 },
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { audioContent?: string };
      if (!data.audioContent) throw new Error("google tts: no audioContent in response");
      return Buffer.from(data.audioContent, "base64");
    }
    // The per-minute quota is shared by every caller of this key; a 429 or a
    // transient 5xx usually clears within a second or two.
    if ((res.status !== 429 && res.status < 500) || attempt >= retries) {
      throw new Error(`google tts ${res.status}: ${await res.text()}`);
    }
    await res.body?.cancel();
    await new Promise((r) => setTimeout(r, 400 * 3 ** attempt));
  }
}
