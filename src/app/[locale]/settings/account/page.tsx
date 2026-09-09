import { getTranslations } from "next-intl/server";
import AvatarUploader from "@/components/profile/AvatarUploader";
import NameEditor from "@/components/profile/NameEditor";
import DeleteAccountRow from "@/components/settings/DeleteAccountRow";
import SettingsShell from "@/components/settings/SettingsShell";
import { LinkRow, Row, Sheet } from "@/components/settings/SettingsList";
import { loadSettings } from "../_data";

// Account: the photo and name you can edit in place, the email you can't,
// the password link — and, a gap below on a sheet of its own, delete.
export default async function AccountSettingsPage() {
  const t = await getTranslations("settings");
  const { user, shell } = await loadSettings();

  return (
    <SettingsShell user={shell} title={t("groupAccount")} back={t("backToSettings")}>
      <Sheet>
        <div className="flex items-center gap-4 min-h-[92px] px-[18px] py-4">
          <AvatarUploader userId={user.id} avatarUrl={shell.avatarUrl} />
          <span className="flex-1 min-w-0">
            <b className="block text-[16px] font-bold text-charcoal">
              <NameEditor userId={user.id} name={shell.displayName} />
            </b>
            <span className="block text-[12.5px] text-muted">{t("avatarHint")}</span>
          </span>
        </div>
        {/* The email sits under its label rather than beside it: a value
            this long either clips or breaks mid-word on a 360px phone. */}
        <Row title={t("emailLabel")} desc={<span className="break-all">{user.email ?? t("noEmail")}</span>} />
        {user.email && <LinkRow title={t("changePassword")} href="/auth/update-password" />}
      </Sheet>

      <DeleteAccountRow streakDays={shell.streakDays} />
    </SettingsShell>
  );
}
