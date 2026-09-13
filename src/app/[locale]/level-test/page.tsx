import { redirect } from "@/i18n/navigation";

// The promotion test is gone (2026-09-13): the level is the learner's own
// choice, set in Settings › Learning. Old links and bookmarks land there.
export default function LevelTestPage() {
  redirect("/settings/learning");
}
