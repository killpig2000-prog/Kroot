"use client";

import { useLocale } from "next-intl";
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
  const pathname = usePathname();
  const router = useRouter();

  function go(code: string) {
    rememberLocale(code);
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: code });
  }

  return (
    <nav aria-label="Language" className={className}>
      {LANGUAGES.map((l, i) => (
        <span key={l.code}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <button
            type="button"
            onClick={() => go(l.code)}
            aria-current={l.code === locale ? "true" : undefined}
            className={l.code === locale ? "font-semibold text-charcoal" : "hover:text-charcoal hover:underline"}
          >
            {l.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
