import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Creates a Stripe Checkout session for a Kroot Plus subscription. Talks to
// the Stripe REST API directly so no SDK dependency is needed.
//
// Required env: STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY.

const PRICE_ENV: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

export async function POST(request: Request) {
  // Backend guard for the same flag PlusCheckoutButton reads — checkout stays
  // closed until payments go live, even if someone posts here directly.
  if (process.env.NEXT_PUBLIC_PAYMENTS_LIVE !== "true") {
    return NextResponse.json(
      { error: "Plus subscriptions haven't opened yet — every lesson is free meanwhile." },
      { status: 503 }
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Check back soon!" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: string };
  const priceId = plan ? PRICE_ENV[plan] : undefined;
  if (!priceId) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: user.id,
    success_url: `${origin}/shop?plus=welcome`,
    cancel_url: `${origin}/pricing`,
    allow_promotion_codes: "true",
  });
  if (user.email) params.set("customer_email", user.email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const session = await res.json();
  if (!res.ok || !session.url) {
    console.error("stripe checkout failed:", session.error?.message ?? res.status);
    return NextResponse.json(
      { error: "Couldn't start checkout. Try again in a moment." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
