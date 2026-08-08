import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Opens a Stripe Billing Portal session so subscribers can cancel, switch
// plans, update cards, and download invoices themselves. Same SDK-less fetch
// style as checkout/webhook. Cancellations come back through the existing
// customer.subscription.deleted webhook, which clears plus_until.

async function stripeForm(path: string, secretKey: string, params: URLSearchParams) {
  return fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "billing_unavailable" }, { status: 503 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: "no_subscription", message: "No subscription found for this account." },
      { status: 400 }
    );
  }

  const returnUrl = `${new URL(request.url).origin}/profile`;
  const params = new URLSearchParams({ customer: customerId, return_url: returnUrl });
  let res = await stripeForm("billing_portal/sessions", secretKey, params);

  // A fresh Stripe account has no portal configuration yet — create a minimal
  // default (cancel + payment-method + invoices) once, then retry.
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const needsConfig = body?.error?.message?.toLowerCase().includes("configuration");
    if (!needsConfig) return NextResponse.json({ error: "portal_failed" }, { status: 502 });

    const config = new URLSearchParams();
    config.set("features[customer_update][enabled]", "false");
    config.set("features[invoice_history][enabled]", "true");
    config.set("features[payment_method_update][enabled]", "true");
    config.set("features[subscription_cancel][enabled]", "true");
    config.set("business_profile[headline]", "Kroot Plus — thanks for keeping the garden growing");
    const created = await stripeForm("billing_portal/configurations", secretKey, config);
    if (!created.ok) return NextResponse.json({ error: "portal_failed" }, { status: 502 });

    res = await stripeForm("billing_portal/sessions", secretKey, params);
    if (!res.ok) return NextResponse.json({ error: "portal_failed" }, { status: 502 });
  }

  const session = await res.json();
  return NextResponse.json({ url: session.url });
}
