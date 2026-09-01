import { createHash } from "crypto";
import { NextResponse, after } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

// Natural Korean TTS via Edge neural voices (free, no quota), cached forever
// in the public `tts` storage bucket under content-hash filenames. The client
// falls back to Web Speech on any failure. The whole content library is also
// pre-generated into the bucket, so this route mostly serves cache misses for
// brand-new content.

// Must mirror the constants in src/lib/tts.ts — the client rebuilds the same
// cache filename to play straight from storage.
const ENGINE = "edge-tts";
const VOICES = { f: "ko-KR-SunHiNeural", m: "ko-KR-InJoonNeural" } as const;
type VoiceKey = keyof typeof VOICES;

const MAX_CHARS = 300;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

async function synthesize(text: string, voice: VoiceKey): Promise<Buffer | null> {
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOICES[voice], OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) chunks.push(chunk as Buffer);
    const audio = Buffer.concat(chunks);
    return audio.length > 0 ? audio : null;
  } catch (e) {
    console.error("edge tts failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isRateLimited("tts", user.id, RATE_LIMIT, RATE_WINDOW_MS)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

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

  const hash = createHash("sha256").update(`${ENGINE}|${voice}|${text}`).digest("hex");
  const objectPath = `${hash}.mp3`;
  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tts/${objectPath}`;

  const cached = await fetch(publicUrl, { method: "HEAD" }).catch(() => null);
  if (cached?.ok) return NextResponse.json({ url: publicUrl });

  const audio = await synthesize(text, voice);
  if (!audio) return NextResponse.json({ error: "tts_failed" }, { status: 502 });

  // Stream the audio back immediately; the cache write can happen after the
  // response — the next listener gets the public URL either way. The
  // filename is a content hash of (engine, voice, text), so the object never
  // changes under that name — a year-long cache is safe and keeps repeat
  // plays off Supabase egress (was defaulting to 1 hour).
  // Written with the service role, not the caller's session. The bucket used
  // to accept an insert from any authenticated user (migration 0025), and
  // because the object name is a hash of (engine, voice, text) that the client
  // computes too, anyone could plant audio under the name of a phrase that
  // hadn't been synthesized yet and have every learner hear it. Migration 0049
  // drops that policy, so this is now the only writer — and the name it writes
  // under is derived from the text it just synthesized, right here.
  after(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error("tts cache write skipped: service role key not configured");
      return;
    }
    const db = createServiceClient(url, serviceKey, { auth: { persistSession: false } });
    const { error } = await db.storage
      .from("tts")
      .upload(objectPath, audio, { contentType: "audio/mpeg", cacheControl: "31536000", upsert: true });
    if (error) console.error("tts cache write failed:", error.message);
  });
  return new NextResponse(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg" } });
}
