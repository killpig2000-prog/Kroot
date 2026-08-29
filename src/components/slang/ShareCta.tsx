"use client";

import { Link } from "@/i18n/navigation";
import { track } from "@vercel/analytics";

// Same CTA as the words/[slug] page, but fires a named event first so we can
// see conversion per slang term (page view → click), not just aggregate
// pageviews — needed to tell which fandom-seeded terms are actually pulling.
export default function ShareCta({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href="/onboarding"
      className={className}
      onClick={() => track("slang_share_cta_click", { slug })}
    >
      {children}
    </Link>
  );
}
