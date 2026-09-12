"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function LoadErrorNotice() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="status"
      className="mb-5 flex items-center gap-3 rounded-[12px] border border-amber-line bg-[var(--tint-amber)] px-4 py-3 text-sm text-charcoal"
    >
      <span className="flex-1 min-w-0">{t("loadError")}</span>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        aria-busy={pending}
        className="flex-none min-h-[44px] rounded-[9px] bg-success px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {t("loadRetry")}
      </button>
    </div>
  );
}
