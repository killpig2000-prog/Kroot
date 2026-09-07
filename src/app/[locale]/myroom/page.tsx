import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { LanguageSwitcher } from "@/components/dashboard/Sidebar";
import ReminderSettings from "@/components/profile/ReminderSettings";
import SoundSettings from "@/components/profile/SoundSettings";
import { MY_ROOM_ITEMS } from "@/components/dashboard/navItems";
import { createClient, getClaimsUser } from "@/lib/supabase/server";

// My room — the learner's own things and settings, split off from the
// three-tab restructure (2026-09-07, step 1 of the My Room plan; see memory
// myroom-restructure-mockup-2026-09-07). Shop, Ranking and My word bank used
// to live in BottomNav's Relax sheet and the Sidebar's long list; Reminder
// and Sound settings used to live on /profile, which is now the pure
// analysis page ("Learn"). Nothing here is new logic — every row links to
// an existing page or wraps an existing settings component.
//
// The garden/tree hero shown in the mockup's My room screen is step 2 of the
// plan (splitting TreeCard's visual into a dashboard "band" + this page's
// hero) — deliberately not done here, so this step stays move-only.

const navKey = (label: string) => (label === "My word bank" ? "myWords" : label.toLowerCase());

export default async function MyRoomPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tn = await getTranslations("nav");
  const t = await getTranslations("ui.account");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [{ data: profile }, extrasRes] = await Promise.all([
    supabase.from("profiles").select("display_name, streak_days, avatar_url").eq("id", user.id).single(),
    supabase
      .from("profiles")
      .select("reminder_push, reminder_email")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  const extras = extrasRes.error ? null : extrasRes.data;
  const streakDays = profile?.streak_days ?? 0;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start md:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={streakDays}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-success-bg text-success border border-success-line items-center justify-center text-[15px] mr-[9px]">
                🌳
              </span>
              {tn("myRoom")}
            </h1>
          </div>

          <div className="max-w-[560px] flex flex-col gap-2.5">
            {MY_ROOM_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 border border-line bg-cream rounded-[14px] px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-success group"
              >
                <span className="flex-none text-[19px] transition-transform group-hover:scale-110" aria-hidden="true">
                  {item.icon}
                </span>
                <b className="flex-1 min-w-0 truncate text-[14.5px] font-bold text-charcoal">{tn(navKey(item.label))}</b>
                <span className="flex-none text-[13px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
                  ›
                </span>
              </Link>
            ))}

            <h2 className="font-semibold text-[15px] mt-3.5">{t("settings")}</h2>

            <div className="max-w-[280px]">
              <LanguageSwitcher pathname="/myroom" locale={locale} />
            </div>

            <ReminderSettings
              userId={user.id}
              initialPush={extras?.reminder_push ?? false}
              initialEmail={extras?.reminder_email ?? false}
              hasEmail={!!user.email}
            />

            <SoundSettings />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
