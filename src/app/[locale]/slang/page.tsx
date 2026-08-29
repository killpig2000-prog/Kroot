import { Link } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import SlangBoard from "@/components/slang/SlangBoard";
import SlangHero from "@/components/slang/SlangHero";
import SlangQuiz from "@/components/slang/SlangQuiz";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { SLANG, slangOfTheDay } from "@/lib/slang";

export const metadata = {
  title: "Korean Slang — the words textbooks skip | Kroot",
  description:
    "Real Korean slang from K-dramas, K-pop, and group chats — meaning, nuance, and an example for each, plus a daily pick.",
};

// Public page: the slang board is a search-engine entry point (sitemap +
// canonical per entry), so it renders signed-out too — just without the
// app chrome and the XP-earning quiz.
export default async function SlangPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, streak_days, avatar_url")
        .eq("id", user.id)
        .single()
    : { data: null };

  const daily = slangOfTheDay();

  if (!user) {
    return (
      <div className="min-h-screen bg-warm text-charcoal">
        <header className="mx-auto flex max-w-[980px] items-center justify-between px-[clamp(18px,4vw,44px)] py-5">
          <Link href="/" className="font-bold text-xl text-success-deep">
            Kroot
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-success-deep transition-colors"
          >
            Start free
          </Link>
        </header>
        <main className="mx-auto max-w-[980px] px-[clamp(18px,4vw,44px)] pb-16">
          <h1 className="font-bold text-[26px] tracking-[-0.02em] mb-1">Korean slang</h1>
          <p className="text-[14px] text-muted mb-6">
            The words textbooks skip — straight from K-dramas, K-pop, and group chats.
          </p>
          <SlangHero entry={daily} />
          <div className="border border-dashed border-success-line bg-success-bg rounded-[14px] px-5 py-4 mb-6 flex items-center gap-3 flex-wrap">
            <span className="flex-1 min-w-[200px] text-[13.5px] text-success-deep">
              Sign up to take the daily slang quiz and earn XP for your tree.
            </span>
            <Link href="/onboarding" className="text-[13px] font-semibold text-success hover:underline">
              Start free →
            </Link>
          </div>
          <SlangBoard entries={SLANG} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Slang</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-pink)] text-[#C13E78] border border-[var(--tint-pink-line)] items-center justify-center kr text-[15px] mr-[9px]">
                슬
              </span>
              Slang
            </h1>
            <span className="text-[13px] text-muted">
              The words textbooks skip — straight from K-dramas, K-pop, and group chats
            </span>
          </div>

          <SlangHero entry={daily} />
          <SlangQuiz />
          <SlangBoard entries={SLANG} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
