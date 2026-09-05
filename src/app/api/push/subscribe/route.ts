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
  const { error: flagErr } = await supabase.from("profiles").update({ reminder_push: true }).eq("id", user.id);
  if (flagErr) {
    console.error("push subscribe flag failed:", flagErr.message);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
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

  // These errors used to be dropped on the floor and the route answered
  // { ok: true } regardless — so a failed delete told the learner they'd
  // unsubscribed while the reminders kept arriving.
  const { error: delErr } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", body.endpoint);
  if (delErr) {
    console.error("push unsubscribe failed:", delErr.message);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
  const { count, error: countErr } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (countErr) {
    console.error("push subscription count failed:", countErr.message);
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }
  if ((count ?? 0) === 0) {
    const { error: flagErr } = await supabase.from("profiles").update({ reminder_push: false }).eq("id", user.id);
    if (flagErr) {
      console.error("push unsubscribe flag failed:", flagErr.message);
      return NextResponse.json({ error: "store_failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
