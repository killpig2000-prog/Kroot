import { Link } from "@/i18n/navigation";
import Nav from "@/components/landing/Nav";
import PlusCheckoutButton from "@/components/pricing/PlusCheckoutButton";
import ManageSubscriptionButton from "@/components/plus/ManageSubscriptionButton";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { PLANS, PLUS_PERKS, isPlus, type PlanKey } from "@/lib/plus";

export const metadata = {
  title: "Pricing — Kroot",
  description: "Core Korean lessons are free forever. Kroot Plus adds unlimited writing with detailed corrections, a streak shield, weekend XP boosts, and exclusive outfits.",
};

const FREE_FEATURES = [
  "4,000+ vocabulary words, A1–C2",
  "Grammar, reading, writing, listening & speaking practice",
  "Level test, promotion tests & the Start-here grammar path",
  "Streaks, XP & your growing tree",
];

export default async function PricingPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  let plusActive = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plus_until")
      .eq("id", user.id)
      .single();
    plusActive = isPlus(profile?.plus_until);
  }

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <Nav />

      <main className="max-w-[880px] mx-auto px-[clamp(18px,4vw,28px)] py-[clamp(40px,6vw,72px)]">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-[7px] rounded-full border border-success-line bg-success-bg px-3.5 py-1.5 text-[12.5px] font-semibold text-success mb-4">
            🌱 Learning is free. Forever.
          </span>
          <h1 className="font-extrabold text-[clamp(28px,4vw,42px)] tracking-[-0.03em] leading-[1.15] mb-3">
            Every lesson is free.
            <br />
            <span className="text-success">Plus</span> makes your garden shine.
          </h1>
          <p className="text-[15px] text-muted max-w-[520px] mx-auto">
            No paywalled lessons, no locked levels. Kroot Plus keeps your streak safe, boosts your
            weekends, writes without limits — and helps keep the garden free for everyone.
          </p>
        </div>

        {plusActive && (
          <div className="border border-amber-line bg-[#FFFBEB] rounded-[14px] px-5 py-4 mb-8 text-center">
            <b className="font-semibold text-[14px]">🌟 You&apos;re a Plus member — thank you!</b>{" "}
            <span className="text-[13px] text-muted">
              Your exclusive outfits are waiting in the{" "}
              <Link href="/shop" className="font-semibold underline">
                shop
              </Link>
              .
            </span>
            <div className="mt-3">
              <ManageSubscriptionButton />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* free plan */}
          <div className="border border-line rounded-2xl p-6 flex flex-col">
            <b className="font-semibold text-[15px] mb-1">Free</b>
            <p className="text-[26px] font-extrabold tracking-[-0.02em] mb-4">
              $0 <span className="text-[13px] font-medium text-faint">forever</span>
            </p>
            <ul className="flex flex-col gap-2 text-[13px] text-muted mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-success">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <Link
                href="/onboarding"
                className="w-full inline-flex items-center justify-center rounded-[10px] border border-line bg-white px-[22px] py-[11px] text-[14px] font-semibold hover:bg-warm transition-colors"
              >
                Start free
              </Link>
            </div>
          </div>

          {/* plus plans */}
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            const highlight = key === "yearly";
            return (
              <div
                key={key}
                className={`rounded-2xl p-6 flex flex-col border ${
                  highlight ? "border-success shadow-[0_12px_32px_rgba(22,163,74,.12)]" : "border-line"
                }`}
              >
                <b className="font-semibold text-[15px] mb-1 flex items-center gap-2">
                  Plus · {plan.label}
                  {plan.note && (
                    <span className="text-[11px] font-semibold text-success bg-success-bg border border-success-line rounded-md px-2 py-0.5">
                      {plan.note}
                    </span>
                  )}
                </b>
                <p className="text-[26px] font-extrabold tracking-[-0.02em] mb-4">
                  {plan.price} <span className="text-[13px] font-medium text-faint">{plan.per}</span>
                </p>
                <ul className="flex flex-col gap-2 text-[13px] text-muted mb-6">
                  <li className="flex gap-2">
                    <span className="text-success">✓</span> Everything in Free
                  </li>
                  {PLUS_PERKS.map((p) => (
                    <li key={p.title} className="flex gap-2">
                      <span>{p.icon}</span> {p.title}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <PlusCheckoutButton plan={key} signedIn={!!user} highlight={highlight} />
                </div>
              </div>
            );
          })}
        </div>

        {/* perks detail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-12">
          {PLUS_PERKS.map((p) => (
            <div key={p.title} className="border border-line rounded-[14px] px-5 py-4">
              <b className="block font-semibold text-[14px] mb-1">
                {p.icon} {p.title}
              </b>
              <p className="text-[13px] text-muted leading-[1.55]">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center text-[12.5px] text-faint leading-[1.7]">
          <b className="font-semibold text-muted">Refunds & cancellation</b>
          <br />
          Not for you? Get a full refund within 14 days of any payment — just reply to your
          receipt email or write to support. After 14 days you can cancel anytime and keep
          Plus until the end of the paid period; the next renewal simply doesn&apos;t happen.
          <br />
          Payments are processed securely by Stripe. Subscribers can cancel self-serve via
          “Manage subscription”.
        </div>
      </main>
    </div>
  );
}
