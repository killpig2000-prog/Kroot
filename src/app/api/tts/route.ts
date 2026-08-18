import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient, getClaimsUser } from "@/lib/supabase/server";

// Natural Korean TTS via Gemini, cached forever in the public `tts` storage
// bucket (content-hash filenames), so each phrase costs one API call total
// across all learners. The client falls back to Web Speech on any failure.

const GEMINI_MODEL = "gemini-3.1-flash-tts-preview";

// Kore is the clear female default; Charon is the lower male counterpart used
// to tell dialogue speakers apart.
const VOICES = { f: "Kore", m: "Charon" } as const;
type VoiceKey = keyof typeof VOICES;

const MAX_CHARS = 300;
const RATE_LIMIT = 30;
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

// Gemini returns raw PCM (s16le mono); browsers need a WAV header around it.
function wavFromPcm(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "tts_unconfigured" }, { status: 503 });

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isRateLimited(user.id)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: { text?: unknown; voice?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > MAX_CHARS || !/[가-힣]/.test(text)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const voice: VoiceKey = body.voice === "m" ? "m" : "f";

  const hash = createHash("sha256").update(`${GEMINI_MODEL}|${voice}|${text}`).digest("hex");
  const objectPath = `${hash}.wav`;
  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tts/${objectPath}`;

  const cached = await fetch(publicUrl, { method: "HEAD" }).catch(() => null);
  if (cached?.ok) return NextResponse.json({ url: publicUrl });

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICES[voice] } },
          },
        },
      }),
    }
  ).catch(() => null);
  if (!geminiRes?.ok) return NextResponse.json({ error: "tts_failed" }, { status: 502 });

  const data = await geminiRes.json();
  const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inline?.data) return NextResponse.json({ error: "tts_failed" }, { status: 502 });

  const sampleRate = Number(/rate=(\d+)/.exec(inline.mimeType ?? "")?.[1] ?? 24000);
  const wav = wavFromPcm(Buffer.from(inline.data, "base64"), sampleRate);

  const { error: uploadError } = await supabase.storage
    .from("tts")
    .upload(objectPath, wav, { contentType: "audio/wav", upsert: true });

  // Cache write failing (bucket missing, quota) shouldn't cost the learner
  // their audio — stream the bytes straight back instead.
  if (uploadError) {
    return new NextResponse(new Uint8Array(wav), { headers: { "Content-Type": "audio/wav" } });
  }
  return NextResponse.json({ url: publicUrl });
}
