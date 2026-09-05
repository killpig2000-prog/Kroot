// Google Cloud Text-to-Speech (Chirp 3 HD), shared between /api/tts and
// scripts/pregen-tts.mts so the voice mapping can't drift between the two
// call sites.

const VOICE_NAMES = { f: "ko-KR-Chirp3-HD-Kore", m: "ko-KR-Chirp3-HD-Charon" } as const;
export const GOOGLE_VOICES = VOICE_NAMES;
export type GoogleVoiceKey = keyof typeof VOICE_NAMES;

export async function synthesizeGoogle(text: string, voice: GoogleVoiceKey): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY not configured");

  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: "ko-KR",
        name: `projects/texttospeech/locations/global/voices/${VOICE_NAMES[voice]}`,
      },
      audioConfig: { audioEncoding: "MP3", sampleRateHertz: 48000 },
    }),
  });
  if (!res.ok) throw new Error(`google tts ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) throw new Error("google tts: no audioContent in response");
  return Buffer.from(data.audioContent, "base64");
}
