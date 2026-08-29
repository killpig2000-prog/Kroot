import { redirect } from "next/navigation";
import { Link, redirect, useRouter, usePathname, getPathname } from "@/i18n/navigation";

// The weekly league is switched off (2026-08-28). The route stays so old links
// and the PWA don't 404 — it just sends people back to the Garden. The tier
// tables, settle_league_weeks() and the ranking RPCs from migration 0026 are
// still in the database; nothing in the app calls them any more, so no week
// settles and no rewards are paid until the feature is re-enabled.
export default function LeaguePage() {
  redirect("/dashboard");
}
