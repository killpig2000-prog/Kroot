import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Composer from "@/components/community/Composer";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isBoardKey } from "@/lib/community";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const t = await getTranslations("community");
  const tn = await getTranslations("nav");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const sp = await searchParams;
  const board = isBoardKey(sp.board) ? sp.board : undefined;
  const displayName = profile?.display_name ?? "there";

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start md:content-stretch">
        <Sidebar
          displayName={displayName}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              {tn("garden")}
            </Link>
            <span>/</span>
            <Link href="/community" className="hover:text-charcoal transition-colors">
              {t("title")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{t("newPost")}</b>
          </div>

          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-slate)] text-[var(--tint-slate-ink)] border border-[var(--tint-slate-line)] items-center justify-center kr text-[15px] mr-[9px]">
                글
              </span>
              {t("newPost")}
            </h1>
          </div>

          <Composer userId={user.id} displayName={displayName} defaultBoard={board} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
