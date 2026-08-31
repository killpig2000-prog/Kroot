import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { LEVEL_ORDER } from "@/lib/tree";
import { languageAlternates, localeUrl } from "@/lib/seo";
import { PUBLIC_VOCAB_WORDS } from "@/lib/vocab-slugs";
import { PUBLIC_SLANG } from "@/lib/slang-slugs";

// Every public page, plus the hreflang cluster for the ones that are really
// translated.
//
// Nothing under PROTECTED_PREFIXES in src/proxy.ts belongs here: /guide,
// /hangul and /level-test look public but redirect a signed-out visitor (and
// every crawler) to /auth/login.

type PublicPage = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  // Only set this once the page's template actually renders translated
  // strings. It is tempting to flip it as soon as a route is *reachable* at
  // /ja/..., but every locale of an untranslated page serves byte-identical
  // English: submitting all five with self-referential canonicals hands Google
  // five rival copies to choose between, which is worse than submitting the
  // English one alone. The whole word and slang dictionary is in that state
  // today — reachable in five locales, written in one.
  localized?: boolean;
};

const PUBLIC_PAGES: PublicPage[] = [
  // The landing page reads every string from the `landing` namespace as of
  // this pass, so it is genuinely five different pages and earns the cluster.
  { path: "/", changeFrequency: "weekly", priority: 1, localized: true },
  { path: "/words", changeFrequency: "weekly", priority: 0.9 },
  { path: "/slang", changeFrequency: "weekly", priority: 0.8 },
  ...LEVEL_ORDER.map((level) => ({
    path: `/words/level/${level.toLowerCase()}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  })),
  ...PUBLIC_VOCAB_WORDS.map((word) => ({
    path: `/words/${word.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  })),
  ...PUBLIC_SLANG.map((entry) => ({
    path: `/slang/${entry.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  })),
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.flatMap(({ path, changeFrequency, priority, localized }) => {
    if (!localized) return [{ url: localeUrl(routing.defaultLocale, path), changeFrequency, priority }];

    const languages = languageAlternates(path);
    return routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}
