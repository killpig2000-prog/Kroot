import { getTranslations } from "next-intl/server";
import ReminderSettings from "@/components/profile/ReminderSettings";
import SettingsShell from "@/components/settings/SettingsShell";
import { loadSettings } from "../_data";

// Daily reminder: two switches. ReminderSettings draws the schedule line
// (it needs the browser's clock for the local hour) and the sheet.
export default async function ReminderSettingsPage() {
  const tr = await getTranslations("profile.reminders");
  const { user, shell, reminderPush, reminderEmail } = await loadSettings();

  return (
    <SettingsShell user={shell} title={tr("title")} back={(await getTranslations("settings"))("backToSettings")}>
      <ReminderSettings
        userId={user.id}
        initialPush={reminderPush}
        initialEmail={reminderEmail}
        hasEmail={!!user.email}
      />
    </SettingsShell>
  );
}
