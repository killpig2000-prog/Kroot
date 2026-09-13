import { getTranslations } from "next-intl/server";
import CapacityRow from "@/components/settings/CapacityRow";
import LanguageRow from "@/components/settings/LanguageRow";
import LevelRow from "@/components/settings/LevelRow";
import SettingsShell from "@/components/settings/SettingsShell";
import { Sheet } from "@/components/settings/SettingsList";
import { isCefrLevel } from "@/lib/tree";
import { loadSettings } from "../_data";

// Learning: three value rows. Each opens a sheet and saves on pick.
export default async function LearningSettingsPage() {
  const t = await getTranslations("settings");
  const { user, shell, level, capacityBonus } = await loadSettings();

  return (
    <SettingsShell user={shell} title={t("groupLearning")} back={t("backToSettings")}>
      <Sheet>
        <LanguageRow />
        <CapacityRow capacityBonus={capacityBonus} />
        <LevelRow userId={user.id} level={isCefrLevel(level) ? level : "A1"} />
      </Sheet>
    </SettingsShell>
  );
}
