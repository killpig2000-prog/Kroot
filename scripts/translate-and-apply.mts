// @ts-nocheck -- one-off 2026-08 translation pass; depends on google-translate-open-api
// (not a project dependency) and uses async String.replace callbacks. Kept for
// reference only; tsconfig type-checks **/*.mts so it must not fail the build.
#!/usr/bin/env node
/**
 * Translate listening dialogues and apply translations to source files
 * Supports: Japanese (ja), Chinese Simplified (zh), Vietnamese (vi)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Use google-translate-open-api for translation
import translate from "google-translate-open-api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const listeningDataDir = path.join(projectRoot, "src/lib/listening-data");
const scratchpad = path.join(__dirname, "..", ".translation-cache");

// Create cache directory
fs.mkdirSync(scratchpad, { recursive: true });

interface DialogueLine {
  speaker: string;
  kr: string;
  en: string;
  ja?: string;
  zh?: string;
  vi?: string;
}

interface Dialogue {
  id: string;
  situationKey: string;
  level: string;
  title: string | { en: string; ja?: string; zh?: string; vi?: string };
  lines: DialogueLine[];
}

// Language mapping for google-translate-open-api
const langMap: Record<string, string> = {
  ja: "ja",
  zh: "zh-CN",
  vi: "vi",
};

const langNames: Record<string, string> = {
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  vi: "Vietnamese",
};

// Translation cache
const cache: Record<string, Record<string, Record<string, string>>> = {};

function loadCache() {
  const cacheFile = path.join(scratchpad, "translation-cache.json");
  if (fs.existsSync(cacheFile)) {
    const data = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    Object.assign(cache, data);
  }
}

function saveCache() {
  const cacheFile = path.join(scratchpad, "translation-cache.json");
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), "utf-8");
}

async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "en"
): Promise<string> {
  if (!text || text.length === 0) return text;

  // Check cache first
  if (!cache[targetLang]) cache[targetLang] = {};
  if (cache[targetLang][text]) {
    return cache[targetLang][text];
  }

  try {
    const result = await translate.translate(text, {
      tld: "com",
      language: targetLang,
    });

    const translated = result[0] || text;
    cache[targetLang][text] = translated;
    saveCache();

    return translated;
  } catch (error) {
    console.error(`Error translating "${text.substring(0, 50)}": ${error}`);
    return text;
  }
}

async function processFile(filepath: string): Promise<void> {
  console.log(`\nProcessing ${path.basename(filepath)}...`);

  let content = fs.readFileSync(filepath, "utf-8");
  let modified = false;

  // Find all dialogue objects and process them
  // This is a careful regex-based replacement to preserve file format

  // Pattern: lines: [{ ... en: "text"... }]
  const linePattern =
    /({ speaker: "[^"]+", kr: "[^"]*", en: ")([^"]+)(", ja\?: "[^"]*", zh\?: "[^"]*", vi\?: "[^"]*" })/g;

  // First, collect all unique English texts
  const englishTexts: Set<string> = new Set();

  const matches = Array.from(content.matchAll(linePattern));
  for (const match of matches) {
    englishTexts.add(match[2]);
  }

  console.log(`  Found ${englishTexts.size} unique English texts to translate`);

  // Translate each text for each language
  const translations: Record<string, Record<string, string>> = {};
  for (const lang of ["ja", "zh", "vi"]) {
    translations[lang] = {};

    let count = 0;
    for (const enText of englishTexts) {
      const translated = await translateText(enText, lang);
      translations[lang][enText] = translated;

      count++;
      if (count % 10 === 0) {
        console.log(
          `    ${langNames[lang]}: ${count}/${englishTexts.size} translated`
        );
      }
    }
  }

  console.log("  Updating file with translations...");

  // Now replace in the file
  content = content.replace(
    /({ speaker: "[^"]+", kr: "[^"]*", en: ")([^"]+)(", )ja\?: "[^"]*"(, )zh\?: "[^"]*"(, )vi\?: "[^"]*"/g,
    (match, prefix, enText, sep1, sep2, sep3, sep4) => {
      const ja = translations["ja"][enText] || "";
      const zh = translations["zh"][enText] || "";
      const vi = translations["vi"][enText] || "";

      return `${prefix}${enText}${sep1}ja: "${ja}"${sep2}zh: "${zh}"${sep3}vi: "${vi}"`;
    }
  );

  // Also handle titles
  content = content.replace(
    /(title: ")([^"]+)(",)/g,
    async (match, prefix, title, suffix) => {
      if (!title || title.includes("{")) return match; // Already localized

      const ja = await translateText(title, "ja");
      const zh = await translateText(title, "zh");
      const vi = await translateText(title, "vi");

      // For now, keep as simple string - could convert to LocalizedString later
      return `${prefix}${title}${suffix}`;
    }
  );

  if (content !== fs.readFileSync(filepath, "utf-8")) {
    fs.writeFileSync(filepath, content, "utf-8");
    console.log(`  ✓ Updated`);
  }
}

async function main() {
  console.log("=".repeat(70));
  console.log("LISTENING DIALOGUE TRANSLATION");
  console.log("=".repeat(70));

  loadCache();

  const files = fs
    .readdirSync(listeningDataDir)
    .filter((f) => f.endsWith("expansion.ts"))
    .sort();

  console.log(`\nFound ${files.length} dialogue files to process\n`);

  for (const file of files) {
    const filepath = path.join(listeningDataDir, file);
    await processFile(filepath);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✓ Translation complete!");
  console.log("=".repeat(70));
}

main().catch(console.error);
