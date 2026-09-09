import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar, { LanguageSwitcher } from "@/components/dashboard/Sidebar";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";
import AvatarUploader from "@/components/profile/AvatarUploader";
import NameEditor from "@/components/profile/NameEditor";
import ReminderSettings from "@/components/profile/ReminderSettings";
import ReviewCapacityButton from "@/components/profile/ReviewCapacityButton";
import { SfxRow } from "@/components/profile/SoundSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import DeleteAccountRow from "@/components/settings/DeleteAccountRow";
import FeedbackRow from "@/components/settings/FeedbackRow";
import SignOutRow from "@/components/settings/SignOutRow";
import { SettingsCard, SettingsLinkRow, SettingsRow } from "@/components/settings/SettingsCard";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { APP_VERSION } from "@/lib/version";
import Glyph from "@/components/dashboard/Glyph";

// Settings — one page for everything that used to be scattered across three
// places: the fold-open block at the bottom of My room (language, reminders,
// sound), the sidebar account menu (dark mode, seasonal theme, log out) and
// the name/avatar editors buried inside the tree card.
//
// Order is by how often a learner comes for it, not by how the code is
// organised: account first, then what they study, then the two sets of
// switches, then the things you read once.

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("settings");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/onboarding");

  const [{ data: profile }, extrasRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url, review_capacity_bonus")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("reminder_push, reminder_email")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  const extras = extrasRes.error ? null : extrasRes.data;

  const displayName = profile?.display_name ?? "there";
  const streakDays = profile?.streak_days ?? 0;
  const level = profile?.current_level ?? "A1";

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={displayName}
          email={user.email ?? ""}
          streakDays={streakDays}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[24px] pb-[100px] xl:pb-[60px]">
          <div className="max-w-[560px] flex flex-col gap-[12px]">
            <header>
              <h1 className="text-[clamp(22px,5vw,28px)] font-bold leading-tight">{t("title")}</h1>
              <p className="text-[13px] text-muted mt-1">{t("subtitle")}</p>
            </header>

            <SettingsCard title={t("groupAccount")}>
              <div className="flex items-center gap-3">
                <AvatarUploader userId={user.id} avatarUrl={profile?.avatar_url ?? null} />
                <span className="flex-1 min-w-0">
                  <b className="block text-[14px] font-semibold">
                    <NameEditor userId={user.id} name={displayName} />
                  </b>
                  <small className="block text-[12.5px] text-muted truncate">
                    {user.email ?? t("noEmail")}
                  </small>
                </span>
              </div>

              {user.email && (
                <SettingsLinkRow
                  icon={<Glyph name="key" className="w-[18px] h-[18px]" />}
                  title={t("changePassword")}
                  desc={t("changePasswordDesc")}
                  href="/auth/update-password"
                />
              )}

              <SignOutRow />
              <DeleteAccountRow streakDays={streakDays} />
            </SettingsCard>

            <SettingsCard title={t("groupLearning")}>
              <SettingsRow
                icon={<Glyph name="globe" className="w-[18px] h-[18px]" />}
                title={t("language")}
                desc={t("languageDesc")}
                wrap
                trailing={
                  // Wide enough for "Tiếng Việt" and "日本語" alike; on a 360px
                  // phone `wrap` drops it under the label rather than shaving
                  // the label down to two words a line.
                  <span className="w-[148px] ml-auto">
                    <LanguageSwitcher pathname="/settings" locale={locale} variant="row" />
                  </span>
                }
              />
              <SettingsLinkRow
                icon={<Glyph name="cap" className="w-[18px] h-[18px]" />}
                title={t("levelTitle")}
                desc={t("levelDesc", { level })}
                href="/profile"
              />
              {/* Free daily-cap picker. It had been left off every screen when
                  the account page was trimmed, so there was no way to change
                  how many words come back a day. */}
              <ReviewCapacityButton capacityBonus={profile?.review_capacity_bonus ?? 0} />
            </SettingsCard>

            <ReminderSettings
              userId={user.id}
              initialPush={extras?.reminder_push ?? false}
              initialEmail={extras?.reminder_email ?? false}
              hasEmail={!!user.email}
            />

            <SettingsCard title={t("groupSound")} id="sound">
              <SfxRow />
              <AppearanceSettings />
            </SettingsCard>

            <SettingsCard title={t("groupAbout")}>
              <SettingsLinkRow
                icon={<Glyph name="doc" className="w-[18px] h-[18px]" />}
                title={t("privacy")}
                desc={t("privacyDesc")}
                href="/privacy"
              />
              <FeedbackRow />
              <SettingsRow
                icon={<Glyph name="sprout" className="w-[18px] h-[18px]" />}
                title={t("version")}
                trailing={
                  <span className="flex-none text-[12.5px] font-semibold text-muted tabular-nums">
                    {APP_VERSION}
                  </span>
                }
              />
            </SettingsCard>
          </div>
        </main>
      </div>

      {/* The feedback row above opens this. */}
      <FeedbackWidget />
      <BottomNav />
    </div>
  );
}
