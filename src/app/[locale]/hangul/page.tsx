import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import HangulExplorer from "@/components/hangul/HangulExplorer";
import LessonBar from "@/components/ui/LessonBar";
import GuidedStep from "@/components/onboarding/GuidedStep";
import { createClient, getClaimsUser } from "@/lib/supabase/server";

export default async function HangulPage() {
  const tn = await getTranslations("nav");
  const locale = await getLocale();
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
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? ""}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
          lessonBar
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">

          <LessonBar href="/hangul" title={tn("hangul")} locale={locale} />

          <GuidedStep step="hangul-pick" />
          <GuidedStep step="hangul-stroke" />
          <GuidedStep step="hangul-nav-vocab" />

          <HangulExplorer userId={user.id} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
