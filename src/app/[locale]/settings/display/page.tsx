import { getTranslations } from "next-intl/server";
import { SfxRow } from "@/components/profile/SoundSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import SettingsShell from "@/components/settings/SettingsShell";
import { Sheet } from "@/components/settings/SettingsList";
import { loadSettings } from "../_data";

// Sound & display: three switches, all device settings — none of them
// touches the account.
export default async function DisplaySettingsPage() {
  const t = await getTranslations("settings");
  const { shell } = await loadSettings();

  return (
    <SettingsShell user={shell} title={t("groupSound")} back={t("backToSettings")}>
      <Sheet>
        <SfxRow />
        <AppearanceSettings />
      </Sheet>
    </SettingsShell>
  );
}
