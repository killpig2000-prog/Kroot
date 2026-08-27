import { NextResponse } from "next/server";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { isTableMissing } from "@/lib/resume";

// First-party analytics sink — see lib/analytics.ts. Accepts sendBeacon
// (text/plain-ish blob) and fetch JSON bodies. Anonymous events are allowed
// so the signup funnel can start before there's a user.
const EVENT_RE = /^[a-z][a-z0-9_]{1,39}$/;
const MAX_PROPS_BYTES = 1024;

export async function POST(request: Request) {
  let payload: { event?: unknown; props?: unknown; anon_id?: unknown };
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const event = typeof payload.event === "string" ? payload.event : "";
  if (!EVENT_RE.test(event)) return NextResponse.json({ error: "bad_event" }, { status: 400 });

  const props =
    payload.props && typeof payload.props === "object" && !Array.isArray(payload.props)
      ? (payload.props as Record<string, unknown>)
      : {};
  if (JSON.stringify(props).length > MAX_PROPS_BYTES) {
    return NextResponse.json({ error: "props_too_large" }, { status: 413 });
  }
  const anonId = typeof payload.anon_id === "string" ? payload.anon_id.slice(0, 64) : null;

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited("track", user?.id ?? anonId ?? ip, 120, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { error } = await supabase
    .from("analytics_events")
    .insert({ user_id: user?.id ?? null, anon_id: anonId, event, props });
  // 42P01: migration 0035 not applied yet — accept silently so clients never retry.
  if (error && !isTableMissing(error)) {
    console.error("analytics insert failed:", error.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
