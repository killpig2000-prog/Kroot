import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { buildFirstLessons } from "@/lib/first-lessons";

// The first-lesson links come from the real content tables (server-side, so
// the 2,800-line grammar module never ships to the client); everything
// interactive lives in OnboardingFlow.
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const sp = await searchParams;
  // Known server-side, so the very first client render already agrees —
  // computing this only in the browser (via window.location) rendered
  // "gate" on the server and "saving" on the client's first paint, a real
  // hydration mismatch that also flashed the Hangul-gate card on screen.
  return <OnboardingFlow lessons={buildFirstLessons()} hasPlacement={!!sp.p} />;
}
