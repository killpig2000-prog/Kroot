import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LANGUAGES } from "@/i18n/locale";
import DisplaySummary from "@/components/settings/DisplaySummary";
import SettingsShell from "@/components/settings/SettingsShell";
import SignOutRow from "@/components/settings/SignOutRow";
import { Chevron, LinkRow, Sheet } from "@/components/settings/SettingsList";
import { dailyReviewCap } from "@/lib/srs";
import { APP_VERSION } from "@/lib/version";
import { loadSettings } from "./_data";

// Settings, first screen (2026-09-10 restructure, user call): one white
// sheet, six rows. Who you are, then the four groups — each with a one-line
// summary of what it currently holds, so "is my reminder on?" is answered
// here — then Sign out. The version is a caption underneath, not a row.
//
// Everything a row leads to is a screen of its own under /settings/…, on
// the same sheet, with "‹ Settings" above its title.

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("settings");
  const tr = await getTranslations("profile.reminders");
  const { shell, level, capacityBonus, reminderPush, reminderEmail } = await loadSettings();

  const language = LANGUAGES.find((l) => l.code === locale)?.label ?? LANGUAGES[0].label;
  const reminders =
    reminderPush && reminderEmail
      ? t("reminderBoth")
      : reminderPush
        ? t("reminderPush")
        : reminderEmail
          ? t("reminderEmail")
          : t("reminderOff");

  return (
    <SettingsShell user={shell} title={t("title")}>
      <Sheet>
        {/* Who these settings belong to. Tapping goes to the Account screen. */}
        <Link
          href="/settings/account"
          className="group flex items-center gap-3.5 min-h-[78px] px-[18px] py-3.5 transition-colors hover:bg-warm-4 active:bg-warm-3"
        >
          <span className="flex-none w-12 h-12 rounded-full overflow-hidden bg-success-bg border border-line flex items-center justify-center text-[22px]">
            {shell.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shell.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              "🦊"
            )}
          </span>
          <span className="flex-1 min-w-0">
            <b className="block text-[16px] font-bold text-charcoal leading-snug truncate">{shell.displayName}</b>
            <span className="block text-[12.5px] text-muted truncate">{shell.email || t("noEmail")}</span>
          </span>
          <Chevron />
        </Link>

        <LinkRow
          tall
          title={t("groupLearning")}
          desc={t("learningSummary", { language, count: dailyReviewCap(capacityBonus), level })}
          href="/settings/learning"
        />
        <LinkRow tall title={tr("title")} desc={reminders} href="/settings/reminders" />
        <LinkRow tall title={t("groupSound")} desc={<DisplaySummary />} href="/settings/display" />
        <LinkRow tall title={t("groupAbout")} desc={`${t("privacy")} · ${t("feedback")}`} href="/settings/about" />
        <SignOutRow />
      </Sheet>

      <p className="text-center text-[12px] text-faint pt-2">{t("versionLine", { version: APP_VERSION })}</p>
    </SettingsShell>
  );
}
