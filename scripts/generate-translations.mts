#!/usr/bin/env node
/**
 * Generate and apply translations to listening dialogues
 * Safely adds ja, zh, vi fields to each line
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const listeningDataDir = path.join(projectRoot, "src/lib/listening-data");

// Load the translate function
let translator: any = null;

async function loadTranslator() {
  try {
    // @ts-ignore -- optional, installed ad hoc when this script is run; not a project dependency
    const mod = await import("google-translate-open-api");
    translator = mod.default;
    return true;
  } catch (error) {
    console.error(
      "Failed to load translator:",
      (error as Error).message
    );
    return false;
  }
}

async function translate(
  text: string,
  targetLang: string
): Promise<string> {
  if (!text) return "";

  try {
    const result = await translator.translate(text, {
      tld: "com",
      language: targetLang,
    });
    return result[0] || text;
  } catch (error) {
    console.error(`Translation error for "${text.substring(0, 30)}":`, error);
    return text;
  }
}

async function processFile(filepath: string, filename: string): Promise<void> {
  console.log(`\n📝 ${filename}`);

  let content = fs.readFileSync(filepath, "utf-8");
  const originalContent = content;

  // Find all lines with en: "..." and add translations
  // Pattern: en: "text"
  // Replace with: en: "text", ja: "...", zh: "...", vi: "..."

  const enPattern = /en:\s*"([^"]+)"/g;
  const texts: Array<{ text: string; startIndex: number; fullMatch: string }> =
    [];

  let match;
  while ((match = enPattern.exec(content)) !== null) {
    texts.push({
      text: match[1],
      startIndex: match.index,
      fullMatch: match[0],
    });
  }

  console.log(`  Found ${texts.length} English texts`);

  // Collect unique texts
  const uniqueTexts = [...new Set(texts.map((t) => t.text))];
  console.log(`  ${uniqueTexts.length} unique texts to translate`);

  // Translate each unique text
  const translations: Record<string, Record<string, string>> = {
    ja: {},
    zh: {},
    vi: {},
  };

  for (let i = 0; i < uniqueTexts.length; i++) {
    const text = uniqueTexts[i];

    for (const lang of ["ja", "zh", "vi"]) {
      const translated = await translate(text, lang);
      translations[lang][text] = translated;
    }

    if ((i + 1) % 10 === 0) {
      console.log(
        `  Progress: ${i + 1}/${uniqueTexts.length} texts translated`
      );
    }

    // Add small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Now replace in content - process from end to start to maintain indices
  const sortedTexts = texts.sort((a, b) => b.startIndex - a.startIndex);

  for (const { text, startIndex, fullMatch } of sortedTexts) {
    const ja = translations.ja[text] || "";
    const zh = translations.zh[text] || "";
    const vi = translations.vi[text] || "";

    const replacement = `${fullMatch}, ja: "${ja}", zh: "${zh}", vi: "${vi}"`;
    content =
      content.substring(0, startIndex) +
      replacement +
      content.substring(startIndex + fullMatch.length);
  }

  // Write back only if changed
  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, "utf-8");
    console.log(`  ✓ Updated with translations`);
  } else {
    console.log(`  No changes`);
  }
}

async function main() {
  console.log("=".repeat(70));
  console.log("LISTENING DIALOGUE TRANSLATOR");
  console.log("=".repeat(70));

  const hasTranslator = await loadTranslator();
  if (!hasTranslator) {
    console.error("❌ Translation failed to initialize");
    process.exit(1);
  }

  console.log("✓ Translator initialized");

  const files = fs
    .readdirSync(listeningDataDir)
    .filter((f) => f.endsWith("expansion.ts"))
    .sort();

  console.log(`Found ${files.length} dialogue files to process`);

  for (const file of files) {
    const filepath = path.join(listeningDataDir, file);
    await processFile(filepath, file);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✓ Translation complete!");
  console.log("=".repeat(70));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
