import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { buildFirstLessons } from "@/lib/first-lessons";

// The first-lesson links come from the real content tables (server-side, so
// the 2,800-line grammar module never ships to the client); everything
// interactive lives in OnboardingFlow.
export default function OnboardingPage() {
  return <OnboardingFlow lessons={buildFirstLessons()} />;
}
