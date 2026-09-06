import { redirect } from "@/i18n/navigation";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { buildFirstLessons } from "@/lib/first-lessons";
import { createClient, getClaimsUser } from "@/lib/supabase/server";

// The first-lesson links come from the real content tables (server-side, so
// the 2,800-line grammar module never ships to the client); everything
// interactive lives in OnboardingFlow.
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  const hasPlacement = !!sp.p;

  // This is the installed app's start_url, so a returning learner lands here
  // every time they open it. Decide on the server: someone signed in who has
  // already placed goes straight to the dashboard without ever seeing the
  // seed intro flash. A learner mid-sign-up (?p= carries their placement)
  // must reach OnboardingFlow — that's the one path that saves it. On a
  // lookup error assume "placed", mirroring the dashboard's own guard, so a
  // hiccup can't trap an established account in onboarding.
  if (!hasPlacement) {
    const supabase = await createClient();
    const user = await getClaimsUser(supabase);
    if (user) {
      const { count, error } = await supabase
        .from("level_test_results")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (error || (count ?? 0) > 0) redirect("/dashboard");
    }
  }

  // Known server-side, so the very first client render already agrees —
  // computing this only in the browser (via window.location) rendered
  // "gate" on the server and "saving" on the client's first paint, a real
  // hydration mismatch that also flashed the Hangul-gate card on screen.
  return <OnboardingFlow lessons={buildFirstLessons()} hasPlacement={hasPlacement} />;
}
