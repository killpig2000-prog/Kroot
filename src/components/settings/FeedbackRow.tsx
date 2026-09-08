"use client";

import { useTranslations } from "next-intl";
import { OPEN_EVENT } from "@/components/dashboard/FeedbackWidget";
import { SettingsButtonRow } from "@/components/settings/SettingsCard";

// FeedbackWidget opens on a window event, so its trigger can live anywhere in
// the tree — here it's a settings row instead of a floating button. The page
// mounts the widget itself.
export default function FeedbackRow() {
  const t = useTranslations("settings");

  return (
    <SettingsButtonRow
      icon="💬"
      title={t("feedback")}
      desc={t("feedbackDesc")}
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    />
  );
}
