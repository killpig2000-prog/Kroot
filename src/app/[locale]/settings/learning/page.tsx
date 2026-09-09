import { getTranslations } from "next-intl/server";
import CapacityRow from "@/components/settings/CapacityRow";
import LanguageRow from "@/components/settings/LanguageRow";
import SettingsShell from "@/components/settings/SettingsShell";
import { LinkRow, Sheet } from "@/components/settings/SettingsList";
import { loadSettings } from "../_data";

// Learning: three value rows. Language and words-a-day open a sheet and save
// on pick; level goes to My progress, where the next test lives.
export default async function LearningSettingsPage() {
  const t = await getTranslations("settings");
  const { shell, level, capacityBonus } = await loadSettings();

  return (
    <SettingsShell user={shell} title={t("groupLearning")} back={t("backToSettings")}>
      <Sheet>
        <LanguageRow />
        <CapacityRow capacityBonus={capacityBonus} />
        <LinkRow title={t("levelTitle")} desc={t("levelHint")} value={level} href="/profile" />
      </Sheet>
    </SettingsShell>
  );
}
