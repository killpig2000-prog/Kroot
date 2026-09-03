import { redirect } from "@/i18n/navigation";

// The weekly league came back as the Ranking ("garden fair") page on
// 2026-09-03. Old /league links and the PWA shortcut land there.
export default function LeaguePage() {
  redirect("/ranking");
}
