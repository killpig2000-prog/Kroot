import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import HangulExplorer from "@/components/hangul/HangulExplorer";
import { createClient, getClaimsUser } from "@/lib/supabase/server";

export default async function HangulPage({
  searchParams,
}: {
  searchParams: Promise<{ tutorial?: string }>;
}) {
  const [tn, t, sp] = await Promise.all([
    getTranslations("nav"),
    getTranslations("tour"),
    searchParams,
  ]);
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

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

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-success-bg text-success border border-success-line items-center justify-center kr text-[15px] mr-[9px]">
                ㄱ
              </span>
              {tn("hangul")}
            </h1>
          </div>

          {sp.tutorial === "writing" && (
            <Link
              href="/writing?tutorial=1"
              className="flex items-center justify-between gap-3 mb-[18px] px-4 py-3 rounded-xl bg-success-bg border border-success-line text-success font-semibold text-[14px] hover:brightness-95 transition-[filter]"
            >
              {t("nextStep.hangulCta")}
              <span aria-hidden="true">→</span>
            </Link>
          )}

          <HangulExplorer />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
