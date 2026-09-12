import { createHash } from "crypto";
import { NextResponse, after } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { synthesizeGoogle, type GoogleVoiceKey } from "@/lib/tts-google";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

// Natural Korean TTS via Google Cloud Chirp 3 HD, cached forever in the
// public `tts` storage bucket under content-hash filenames. The client falls
// back to Web Speech on any failure. The whole content library is also
// pre-generated into the bucket, so this route mostly serves cache misses for
// brand-new content.

// Must mirror the constant in src/lib/tts.ts — the client rebuilds the same
// cache filename to play straight from storage.
const ENGINE = "chirp3-hd";

const MAX_CHARS = 300;
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
// Billed syntheses (cache misses) per learner per rolling 24h. The whole
// library is pre-generated, so a real learner rarely misses more than a few.
const DAILY_SYNTH_LIMIT = 150;

function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && serviceKey ? createServiceClient(url, serviceKey, { auth: { persistSession: false } }) : null;
}

async function synthesize(text: string, voice: GoogleVoiceKey): Promise<Buffer | null> {
  try {
    return await synthesizeGoogle(text, voice);
  } catch (e) {
    console.error("google tts failed:", e instanceof Error ? e.message : e);
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
  const voice: GoogleVoiceKey = body.voice === "m" ? "m" : "f";

  const hash = createHash("sha256").update(`${ENGINE}|${voice}|${text}`).digest("hex");
  const objectPath = `${hash}.mp3`;
  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tts/${objectPath}`;

  const cached = await fetch(publicUrl, { method: "HEAD" }).catch(() => null);
  if (cached?.ok) return NextResponse.json({ url: publicUrl });

  // The in-memory limiter above resets with every serverless instance; this
  // one (migration 0084) holds across them. Fails open until it's applied.
  const db = serviceDb();
  if (db) {
    const { count, error } = await db
      .from("tts_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
    if (!error && (count ?? 0) >= DAILY_SYNTH_LIMIT) {
      return NextResponse.json({ error: "daily_limit" }, { status: 429 });
    }
  }

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
    if (!db) {
      console.error("tts cache write skipped: service role key not configured");
      return;
    }
    const [upload, usage] = await Promise.all([
      db.storage
        .from("tts")
        .upload(objectPath, audio, { contentType: "audio/mpeg", cacheControl: "31536000", upsert: true }),
      db.from("tts_usage").insert({ user_id: user.id, chars: text.length }),
    ]);
    if (upload.error) console.error("tts cache write failed:", upload.error.message);
    // 42P01 / PGRST205: table not created yet (0084 unapplied)
    if (usage.error && !["42P01", "PGRST205"].includes(usage.error.code)) {
      console.error("tts usage write failed:", usage.error.message);
    }
  });
  return new NextResponse(new Uint8Array(audio), { headers: { "Content-Type": "audio/mpeg" } });
}
