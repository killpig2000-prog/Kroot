"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { rememberLocale } from "@/i18n/locale";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-Hans", label: "中文" },
  { code: "vi", label: "Tiếng Việt" },
];

// One-line language row for pages without the sidebar (onboarding, auth):
// the very first screen a ja/zh/vi visitor sees must let them switch.
export default function LanguageLinks({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("ui");
  const pathname = usePathname();
  const router = useRouter();
  // The locale swap is a full RSC round-trip — without this, a tap on a slow
  // connection looks like nothing happened.
  const [isPending, startTransition] = useTransition();
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  function go(code: string) {
    if (code === locale) return;
    rememberLocale(code);
    setPendingCode(code);
    startTransition(() => {
      router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: code });
    });
  }

  return (
    <nav aria-label={t("languageNav")} className={className} aria-busy={isPending}>
      {LANGUAGES.map((l, i) => (
        <span key={l.code}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <button
            type="button"
            onClick={() => go(l.code)}
            disabled={isPending}
            aria-current={l.code === locale ? "true" : undefined}
            className={`disabled:opacity-60 ${
              l.code === locale ? "font-semibold text-charcoal" : "hover:text-charcoal hover:underline"
            }`}
          >
            {isPending && pendingCode === l.code && (
              <span
                className="inline-block w-2.5 h-2.5 mr-1 rounded-full border-2 border-line border-t-success-deep animate-spin align-middle"
                aria-hidden="true"
              />
            )}
            {l.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
