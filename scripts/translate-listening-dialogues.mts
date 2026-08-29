#!/usr/bin/env node

/**
 * Translate listening dialogue files to Japanese, Chinese (Simplified), and Vietnamese
 * Uses Google Translate API via libre-translate-js or a batch translation approach
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const listeningDataDir = path.join(__dirname, "../src/lib/listening-data");

interface DialogueLine {
  speaker: string;
  kr: string;
  en: string;
  ja: string;
  zh: string;
  vi: string;
}

interface Dialogue {
  id: string;
  situationKey: string;
  level: string;
  title: string;
  lines: DialogueLine[];
}

// Translation cache to avoid redundant translations
const translationCache: Map<string, Map<string, string>> = new Map();

/**
 * Batch translate texts using a free translation service
 * Falls back to placeholder if unavailable
 */
async function translateBatch(
  texts: string[],
  targetLang: "ja" | "zh" | "vi"
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  console.log(`Translating ${texts.length} texts to ${targetLang}...`);

  // Try using libre-translate or Google Translate API
  // For now, using a local implementation or fallback strategy
  for (const text of texts) {
    if (!text) {
      result.set(text, "");
      continue;
    }

    // Check cache first
    if (translationCache.has(targetLang)) {
      const langCache = translationCache.get(targetLang)!;
      if (langCache.has(text)) {
        result.set(text, langCache.get(text)!);
        continue;
      }
    }

    // Placeholder: in production, call actual translation API
    // For now, we'll use a marker so translations can be filled in later
    result.set(text, `[TRANSLATE: ${targetLang}] ${text}`);
  }

  // Cache the results
  if (!translationCache.has(targetLang)) {
    translationCache.set(targetLang, new Map());
  }
  const langCache = translationCache.get(targetLang)!;
  for (const [key, value] of result) {
    langCache.set(key, value);
  }

  return result;
}

/**
 * Process a single listening data file
 */
async function processFile(filePath: string): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Processing: ${path.basename(filePath)}`);
  console.log("=".repeat(60));

  let content = fs.readFileSync(filePath, "utf-8");

  // Find all en strings that need translation
  const enMatches = content.match(/en:\s*"([^"]+)"/g) || [];
  const enTexts = new Set(
    enMatches
      .map((m) => m.match(/en:\s*"([^"]+)"/)?.[1])
      .filter(Boolean) as string[]
  );

  // Find all title strings that need translation
  const titleMatches = content.match(/title:\s*"([^"]+)"/g) || [];
  const titleTexts = new Set(
    titleMatches
      .map((m) => m.match(/title:\s*"([^"]+)"/)?.[1])
      .filter(Boolean) as string[]
  );

  console.log(`Found ${enTexts.size} unique English texts to translate`);
  console.log(`Found ${titleTexts.size} unique titles to translate`);

  // Translate to each target language
  const languages = ["ja", "zh", "vi"] as const;

  for (const lang of languages) {
    const enTextsArray = Array.from(enTexts);
    const translations = await translateBatch(enTextsArray, lang);

    // Replace in content
    for (const [original, translated] of translations) {
      // Replace en fields with translations
      const pattern = `(en:\\s*"${original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}")`;
      const replacement = `en: "${original}", ${lang}: "${translated}"`;
      // More precise replacement needed...
    }
  }

  // For now, mark that translations are needed
  console.log(
    `File ${path.basename(filePath)}: Identified texts, ready for translation`
  );
}

/**
 * Main function
 */
async function main() {
  console.log("Listening Dialogue Translation Tool");
  console.log(`Source directory: ${listeningDataDir}\n`);

  const files = fs
    .readdirSync(listeningDataDir)
    .filter((f) => f.endsWith(".ts") && f.includes("expansion"))
    .sort();

  console.log(`Found ${files.length} listening data files\n`);

  let totalTexts = 0;
  for (const file of files) {
    const filePath = path.join(listeningDataDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const enMatches = (content.match(/en:\s*"([^"]+)"/g) || []).length;
    const titleMatches = (content.match(/title:\s*"([^"]+)"/g) || []).length;

    totalTexts += enMatches + titleMatches;
    console.log(`${file}: ${enMatches} lines, ${titleMatches} titles`);
  }

  console.log(
    `\nTotal: ${totalTexts} texts to translate × 3 languages = ${totalTexts * 3} translations needed`
  );
  console.log(
    "\nNote: This is a scaffolding script. Actual translation requires:"
  );
  console.log("  1. Google Translate API key");
  console.log("  2. Azure Translator or similar service");
  console.log("  3. Running the script with API credentials configured");
}

main().catch(console.error);
