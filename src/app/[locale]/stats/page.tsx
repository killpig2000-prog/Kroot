import { redirect } from "next/navigation";
import { Link, redirect, useRouter, usePathname, getPathname } from "@/i18n/navigation";

// Insights used to live here, then moved into My growth. It's switched off
// while it gets rebuilt (2026-08-28), so old /stats links land on the profile
// itself rather than an #insights anchor that no longer renders.
export default function StatsPage() {
  redirect("/profile");
}
