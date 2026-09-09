"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { SettingsButtonRow } from "@/components/settings/SettingsCard";

// Same two-step sign-out the sidebar menu used: clear the browser's own copy
// of the session, then let the server expire the auth cookies — the browser
// client can't reliably delete cookies that were set with server options.
export default function SignOutRow() {
  const t = useTranslations("settings");
  const supabase = useMemo(() => createClient(), []);
  const [leaving, setLeaving] = useState(false);

  async function signOut() {
    if (leaving) return;
    setLeaving(true);
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    await fetch("/auth/signout", { method: "POST" }).catch(() => {});
    window.location.assign("/");
  }

  return (
    <SettingsButtonRow
      title={leaving ? t("signingOut") : t("signOut")}
      onClick={() => void signOut()}
      disabled={leaving}
    />
  );
}
