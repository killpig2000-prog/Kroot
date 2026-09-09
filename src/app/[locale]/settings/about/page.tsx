import { getTranslations } from "next-intl/server";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";
import FeedbackRow from "@/components/settings/FeedbackRow";
import SettingsShell from "@/components/settings/SettingsShell";
import { LinkRow, Sheet } from "@/components/settings/SettingsList";
import { loadSettings } from "../_data";

// About: the two things you read once. The feedback row opens the widget
// mounted below it.
export default async function AboutSettingsPage() {
  const t = await getTranslations("settings");
  const { shell } = await loadSettings();

  return (
    <SettingsShell user={shell} title={t("groupAbout")} back={t("backToSettings")}>
      <Sheet>
        <LinkRow title={t("privacy")} desc={t("privacyDesc")} href="/privacy" />
        <FeedbackRow />
      </Sheet>
      <FeedbackWidget />
    </SettingsShell>
  );
}
