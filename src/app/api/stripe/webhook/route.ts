import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Stripe webhook: the only writer of profiles.plus_until. Verifies the
// Stripe-Signature header (HMAC-SHA256 over "<timestamp>.<raw body>") without
// the SDK, then applies subscription state with the service-role key.
//
// Required env: STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY,
// SUPABASE_SERVICE_ROLE_KEY (+ NEXT_PUBLIC_SUPABASE_URL).
// Subscribe the endpoint to: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted.

const TOLERANCE_SECONDS = 300;

function verifySignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = new Map(
    header.split(",").map((kv) => {
      const [k, ...v] = kv.split("=");
      return [k.trim(), v.join("=")] as const;
    })
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function fetchSubscription(id: string) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${id}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  return res.ok ? res.json() : null;
}

// Newer Stripe API versions moved current_period_end off the subscription
// onto its items — read both places or a cancel event wipes Plus instantly.
type SubLike = {
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
};
function periodEndSeconds(sub: SubLike): number | null {
  if (typeof sub.current_period_end === "number") return sub.current_period_end;
  const ends = (sub.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter((n): n is number => typeof n === "number");
  return ends.length ? Math.max(...ends) : null;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  if (!verifySignature(payload, request.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);
  const supabase = adminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId: string | undefined = session.client_reference_id;
    const customerId: string | undefined = session.customer;
    if (!userId || !customerId) return NextResponse.json({ received: true });

    // A grace default of 35 days covers the gap until the first
    // subscription.updated event lands with the real period end.
    let plusUntil = new Date(Date.now() + 35 * 86_400_000).toISOString();
    if (session.subscription) {
      const sub = await fetchSubscription(session.subscription);
      const end = sub ? periodEndSeconds(sub) : null;
      if (end) plusUntil = new Date(end * 1000).toISOString();
    }

    const { error } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId, plus_until: plusUntil })
      .eq("id", userId);
    if (error) console.error("plus grant failed:", error.message);
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const active = sub.status === "active" || sub.status === "trialing";
    const end = periodEndSeconds(sub);
    // On cancel/expiry, access runs to the end of the paid period. If Stripe
    // didn't include the period end, keep the stored value rather than
    // guessing — never shorten a member's paid time.
    let plusUntil: string | null = null;
    if (active || sub.status === "canceled") {
      plusUntil = end ? new Date(end * 1000).toISOString() : null;
    } else {
      plusUntil = new Date().toISOString();
    }

    if (plusUntil) {
      const { error } = await supabase
        .from("profiles")
        .update({ plus_until: plusUntil })
        .eq("stripe_customer_id", sub.customer);
      if (error) console.error("plus update failed:", error.message);
    }
  }

  return NextResponse.json({ received: true });
}
