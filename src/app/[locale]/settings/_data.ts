import { redirect } from "@/i18n/navigation";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import type { ShellUser } from "@/components/settings/SettingsShell";

// What every Settings screen needs before it can draw: who's signed in and
// the profile row. One read; the screens pick the columns they use. The
// first screen also needs the two reminder flags, which live on the same
// row but were added later, so they're read separately and tolerated
// missing.

export async function loadSettings() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/onboarding");

  const [{ data: profile }, extrasRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url, review_capacity_bonus")
      .eq("id", user.id)
      .single(),
    supabase.from("profiles").select("reminder_push, reminder_email").eq("id", user.id).maybeSingle(),
  ]);
  const extras = extrasRes.error ? null : extrasRes.data;

  const shell: ShellUser = {
    displayName: profile?.display_name ?? "there",
    email: user.email ?? "",
    streakDays: profile?.streak_days ?? 0,
    avatarUrl: profile?.avatar_url ?? null,
  };

  return {
    user,
    shell,
    level: profile?.current_level ?? "A1",
    capacityBonus: profile?.review_capacity_bonus ?? 0,
    reminderPush: extras?.reminder_push ?? false,
    reminderEmail: extras?.reminder_email ?? false,
  };
}
