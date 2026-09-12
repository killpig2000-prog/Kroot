"use client";

import { useTranslations } from "next-intl";
import { useOffline } from "@/lib/use-offline";

export default function OfflineNotice() {
  const t = useTranslations("common");
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-[max(10px,env(safe-area-inset-top))] z-[70] max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full bg-[#4A4237] px-3.5 py-1.5 text-center text-[12.5px] font-semibold text-[#FFF9EC] shadow-[0_6px_16px_-8px_rgba(0,0,0,.45)]"
    >
      {t("offline")}
    </div>
  );
}
