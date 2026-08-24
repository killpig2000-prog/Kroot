import { redirect } from "next/navigation";

// Insights merged into My growth (see InsightsSection); keep old links alive.
export default function StatsPage() {
  redirect("/profile#insights");
}
