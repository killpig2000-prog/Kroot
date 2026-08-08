// Kroot Plus subscription helpers. The source of truth is profiles.plus_until,
// written by the Stripe webhook — never by the client.

export function isPlus(plusUntil: string | null | undefined): boolean {
  return !!plusUntil && new Date(plusUntil).getTime() > Date.now();
}

// Gate on new subscriptions. Stripe runs in TEST mode (Korea can't activate
// live Stripe), so real cards would be declined — keep checkout closed in
// production until a merchant-of-record integration goes live. Existing
// subscribers keep their perks and the billing portal either way.
export const PAYMENTS_LIVE = process.env.NEXT_PUBLIC_PAYMENTS_LIVE === "true";

export type PlanKey = "monthly" | "yearly";

export const PLANS: Record<
  PlanKey,
  { label: string; price: string; per: string; note?: string }
> = {
  monthly: { label: "Monthly", price: "$4.99", per: "/ month" },
  yearly: { label: "Yearly", price: "$39.99", per: "/ year", note: "2 months free" },
};

export const PLUS_PERKS = [
  { icon: "✍️", title: "Unlimited writing", desc: "Free writes one page a day — Plus turns as many pages as you like, with sentence-by-sentence corrections on every one." },
  { icon: "🛡️", title: "Streak shield", desc: "Miss a day? Your streak survives — one skipped day never breaks the run." },
  { icon: "⚡", title: "Weekend XP boost", desc: "Earn 1.5x XP every Saturday and Sunday — climb the weekly league faster." },
  { icon: "📊", title: "Learning insights", desc: "A detailed stats page: accuracy by skill, weakest words, and your XP timeline." },
  { icon: "🎩", title: "Exclusive outfits", desc: "Nine Plus-only costumes for your tree — free to claim while subscribed." },
  { icon: "🌟", title: "Plus badge", desc: "A golden name on your profile, in the community, and in the weekly league." },
];
