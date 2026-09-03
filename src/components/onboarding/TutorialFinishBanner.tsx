"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

// Shown once when the Hangul → Writing → Shop tutorial chain (or a Skip out
// of it) lands the learner back on the dashboard with ?tutorial=done.
export default function TutorialFinishBanner() {
  const t = useTranslations("tour");
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const show = params.get("tutorial") === "done" && !dismissed;

  // Drop the query param from the URL bar without a navigation, so a reload
  // doesn't bring the banner back.
  useEffect(() => {
    if (params.get("tutorial") !== "done") return;
    const url = new URL(window.location.href);
    url.searchParams.delete("tutorial");
    window.history.replaceState(null, "", url.toString());
  }, [params]);

  if (!show) return null;

  return (
    <div className="flex items-center justify-between gap-3 mb-6 px-4 py-3 rounded-xl bg-success-bg border border-success-line text-success font-semibold text-[14px]">
      {t("nextStep.finishBanner")}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-success/70 hover:text-success shrink-0"
        aria-label={t("skip")}
      >
        ✕
      </button>
    </div>
  );
}
