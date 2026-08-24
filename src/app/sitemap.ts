import type { MetadataRoute } from "next";
import { LEVEL_ORDER } from "@/lib/tree";
import { SITE_URL } from "@/lib/site";
import { PUBLIC_VOCAB_WORDS } from "@/lib/vocab-slugs";
import { PUBLIC_SLANG } from "@/lib/slang-slugs";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/words`, changeFrequency: "weekly", priority: 0.9 },
    ...LEVEL_ORDER.map((level) => ({
      url: `${SITE_URL}/words/level/${level.toLowerCase()}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...PUBLIC_VOCAB_WORDS.map((word) => ({
      url: `${SITE_URL}/words/${word.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...PUBLIC_SLANG.map((entry) => ({
      url: `${SITE_URL}/slang/${entry.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
