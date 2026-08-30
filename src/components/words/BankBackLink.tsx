"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// The public dictionary page has its own marketing header, so a learner who
// arrived from their word bank has no app chrome to get back with. Reading
// ?from=bank from the client keeps the page itself statically prerendered.
export default function BankBackLink() {
  const params = useSearchParams();
  const t = useTranslations("vocabulary");
  if (params.get("from") !== "bank") return null;
  return (
    <p className="mb-3">
      <Link
        href="/review/words"
        className="inline-flex items-center min-h-[40px] text-sm font-semibold text-[var(--deep)] hover:underline"
      >
        ← {t("bank.backToBank")}
      </Link>
    </p>
  );
}
