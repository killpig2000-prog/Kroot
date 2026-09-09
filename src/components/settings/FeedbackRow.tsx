"use client";

import { useTranslations } from "next-intl";
import { OPEN_EVENT } from "@/components/dashboard/FeedbackWidget";
import { ButtonRow } from "@/components/settings/SettingsList";

// FeedbackWidget opens on a window event, so its trigger can live anywhere in
// the tree — here it's a settings row instead of a floating button. The About
// screen mounts the widget itself.
export default function FeedbackRow() {
  const t = useTranslations("settings");

  return <ButtonRow title={t("feedback")} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} />;
}
