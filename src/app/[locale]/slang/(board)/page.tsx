import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LessonBar from "@/components/ui/LessonBar";
import SlangBoard from "@/components/slang/SlangBoard";
import SlangHero from "@/components/slang/SlangHero";
import SlangRound from "@/components/slang/SlangRound";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { seoAlternates } from "@/lib/seo";
import { SLANG, slangOfTheDay } from "@/lib/slang";

// The board was in nobody's sitemap and declared no canonical at all, even
// though it is the hub every /slang/[slug] page links back to.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Korean Slang — the words textbooks skip | Kroot",
    description:
      "Real Korean slang from K-dramas, K-pop, and group chats — meaning, nuance, and an example for each, plus a daily pick.",
    alternates: seoAlternates(locale, "/slang"),
  };
}

// Public page: the slang board is a search-engine entry point (sitemap +
// canonical per entry), so it renders signed-out too — just without the
// app chrome and the XP-earning quiz.
export default async function SlangPage() {
  const [t, tn, locale] = await Promise.all([getTranslations("slang"), getTranslations("nav"), getLocale()]);
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
            {t("startFree")}
          </Link>
        </header>
        <main className="mx-auto max-w-[980px] px-[clamp(18px,4vw,44px)] pb-16">
          <h1 className="font-bold text-[26px] tracking-[-0.02em] mb-1">{tn("koreanSlang")}</h1>
          <p className="text-[14px] text-muted mb-6">{t("taglineDot")}</p>
          <SlangHero entry={daily} />
          <div className="border border-dashed border-success-line bg-success-bg rounded-[14px] px-5 py-4 mb-6 flex items-center gap-3 flex-wrap">
            <span className="flex-1 min-w-[200px] text-[13.5px] text-success-deep">
              {t("signupNudge")}
            </span>
            <Link href="/onboarding" className="text-[13px] font-semibold text-success hover:underline">
              {t("startFreeArrow")}
            </Link>
          </div>
          <SlangBoard entries={SLANG} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
          lessonBar
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px] min-h-screen flex flex-col">
          <LessonBar href="/slang" title={tn("slang")} locale={locale} />

          {/* Signed in, the page is one round at a time: five random cards,
              then a quiz on them (2026-09-11). The banner, the separate daily
              challenge and the 153-card grid stay on the public page above,
              which search engines index. */}
          <div className="flex-1 flex flex-col justify-center">
            <SlangRound entries={SLANG} today={daily} />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
