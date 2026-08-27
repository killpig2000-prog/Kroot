import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackServer } from "@/lib/analytics";

// Stores / removes a browser's Web Push subscription for the signed-in user.
type SubJson = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { subscription?: SubJson; userAgent?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys.auth || sub.endpoint.length > 2048) {
    return NextResponse.json({ error: "bad_subscription" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: typeof body.userAgent === "string" ? body.userAgent.slice(0, 200) : null,
    },
    { onConflict: "endpoint" }
  );
  if (error) {
    console.error("push subscribe failed:", error.message);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }

  // Subscribing implies the push reminder is wanted.
  await supabase.from("profiles").update({ reminder_push: true }).eq("id", user.id);
  await trackServer(supabase, user.id, "push_subscribed");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (!body.endpoint) return NextResponse.json({ error: "bad_endpoint" }, { status: 400 });

  await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", body.endpoint);
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) === 0) await supabase.from("profiles").update({ reminder_push: false }).eq("id", user.id);
  return NextResponse.json({ ok: true });
}
