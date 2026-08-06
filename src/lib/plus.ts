// Kroot Plus subscription helpers. The source of truth is profiles.plus_until,
// written by the Stripe webhook — never by the client.

export function isPlus(plusUntil: string | null | undefined): boolean {
  return !!plusUntil && new Date(plusUntil).getTime() > Date.now();
}

export type PlanKey = "monthly" | "yearly";

export const PLANS: Record<
  PlanKey,
  { label: string; price: string; per: string; note?: string }
> = {
  monthly: { label: "Monthly", price: "$4.99", per: "/ month" },
  yearly: { label: "Yearly", price: "$39.99", per: "/ year", note: "2 months free" },
};

export const PLUS_PERKS = [
  { icon: "🎩", title: "Exclusive outfits", desc: "Plus-only costumes for your tree — free to claim while subscribed." },
  { icon: "🌟", title: "Plus badge", desc: "A golden badge on your profile and in the weekly league." },
  { icon: "🚀", title: "Early access", desc: "New topics, features, and seasonal events land on Plus first." },
  { icon: "💚", title: "Keep Kroot growing", desc: "Core lessons stay free for everyone — Plus pays the water bill." },
];
