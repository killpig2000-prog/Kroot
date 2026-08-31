#!/usr/bin/env node
/**
 * Apply translations to listening dialogue files
 * Reads extracted translations and updates source files safely
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const listeningDataDir = path.join(projectRoot, "src/lib/listening-data");

// Simple inline translator (will use google-translate-open-api)
let translator: any = null;

async function initTranslator() {
  try {
    // @ts-ignore -- optional, installed ad hoc when this script is run; not a project dependency
    const mod = await import("google-translate-open-api");
    translator = mod.default;
    console.log("✓ Translation API initialized");
  } catch (error) {
    console.error(
      "⚠ Could not load google-translate-open-api:",
      (error as Error).message
    );
  }
}

async function translateBatch(texts: string[], targetLang: string) {
  if (!translator) return texts.map(() => "");

  try {
    const results: string[] = [];
    for (const text of texts) {
      if (!text) {
        results.push("");
        continue;
      }

      try {
        const result = await translator.translate(text, {
          tld: "com",
          language: targetLang,
        });
        results.push(result[0] || text);
      } catch (err) {
        console.error(`  Error translating: ${text.substring(0, 30)}`);
        results.push("");
      }
    }
    return results;
  } catch (error) {
    console.error("Translation batch error:", error);
    return texts.map(() => "");
  }
}

interface TranslationMap {
  ja: Map<string, string>;
  zh: Map<string, string>;
  vi: Map<string, string>;
}

async function buildTranslationMap(): Promise<TranslationMap> {
  const map: TranslationMap = {
    ja: new Map(),
    zh: new Map(),
    vi: new Map(),
  };

  // Collect all English texts from all files
  const englishTexts = new Set<string>();

  const files = fs
    .readdirSync(listeningDataDir)
    .filter((f) => f.endsWith("expansion.ts"));

  for (const file of files) {
    const filepath = path.join(listeningDataDir, file);
    const content = fs.readFileSync(filepath, "utf-8");

    // Extract all English texts (en: "...")
    const enPattern = /en:\s*"([^"]+)"/g;
    let match;
    while ((match = enPattern.exec(content)) !== null) {
      englishTexts.add(match[1]);
    }

    // Also extract titles
    const titlePattern = /title:\s*"([^"]+)"/g;
    while ((match = titlePattern.exec(content)) !== null) {
      englishTexts.add(match[1]);
    }
  }

  console.log(
    `Found ${englishTexts.size} unique English texts to translate\n`
  );

  // Translate for each language
  const langMap = {
    ja: "Japanese",
    zh: "Chinese",
    vi: "Vietnamese",
  };

  const langCodes: Array<"ja" | "zh" | "vi"> = ["ja", "zh", "vi"];

  for (const lang of langCodes) {
    const texts = Array.from(englishTexts);
    console.log(`Translating to ${langMap[lang]}...`);

    const translations = await translateBatch(texts, lang);
    for (let i = 0; i < texts.length; i++) {
      if (translations[i]) {
        map[lang].set(texts[i], translations[i]);
      }
    }

    console.log(`  ✓ ${map[lang].size}/${texts.length} translated\n`);
  }

  return map;
}

function applyTranslationsToFile(
  filepath: string,
  translations: TranslationMap
): string {
  const content = fs.readFileSync(filepath, "utf-8");
  const originalContent = content;

  // Process each line that contains en: "..."
  const lines = content.split("\n");
  const newLines: string[] = [];

  for (const line of lines) {
    if (line.includes('en: "') && line.includes('"}')) {
      // Extract the English text
      const enMatch = line.match(/en:\s*"([^"]+)"/);
      if (enMatch) {
        const enText = enMatch[1];
        const ja = translations.ja.get(enText) || "";
        const zh = translations.zh.get(enText) || "";
        const vi = translations.vi.get(enText) || "";

        // Replace or add translation fields
        let newLine = line;

        if (line.includes("ja:")) {
          newLine = newLine.replace(/ja:\s*"[^"]*"/, `ja: "${ja}"`);
        } else {
          newLine = newLine.replace(/en:\s*"[^"]*"/, `en: "${enText}", ja: "${ja}"`);
        }

        if (line.includes("zh:")) {
          newLine = newLine.replace(/zh:\s*"[^"]*"/, `zh: "${zh}"`);
        } else if (!line.includes("zh:")) {
          newLine = newLine.replace(/ja:\s*"[^"]*"/, `ja: "${ja}", zh: "${zh}"`);
        }

        if (line.includes("vi:")) {
          newLine = newLine.replace(/vi:\s*"[^"]*"/, `vi: "${vi}"`);
        } else if (!line.includes("vi:")) {
          newLine = newLine.replace(/zh:\s*"[^"]*"/, `zh: "${zh}", vi: "${vi}"`);
        }

        newLines.push(newLine);
      } else {
        newLines.push(line);
      }
    } else if (line.includes('title: "') && !line.includes("LocalizedString")) {
      // Handle titles
      const titleMatch = line.match(/title:\s*"([^"]+)"/);
      if (titleMatch) {
        const titleText = titleMatch[1];
        const ja = translations.ja.get(titleText) || "";
        const zh = translations.zh.get(titleText) || "";
        const vi = translations.vi.get(titleText) || "";

        // Keep original for now - could convert to LocalizedString later
        newLines.push(line);
      } else {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  return newLines.join("\n");
}

async function main() {
  console.log("=".repeat(70));
  console.log("APPLY TRANSLATIONS TO LISTENING DIALOGUES");
  console.log("=".repeat(70));
  console.log();

  await initTranslator();
  console.log();

  const translations = await buildTranslationMap();

  // Apply translations to each file
  const files = fs
    .readdirSync(listeningDataDir)
    .filter((f) => f.endsWith("expansion.ts"))
    .sort();

  console.log(`\nApplying translations to ${files.length} files...\n`);

  for (const file of files) {
    const filepath = path.join(listeningDataDir, file);
    console.log(`  ${file}...`);

    const updated = applyTranslationsToFile(filepath, translations);
    fs.writeFileSync(filepath, updated, "utf-8");
  }

  console.log("\n" + "=".repeat(70));
  console.log("✓ Translation application complete!");
  console.log("=".repeat(70));
}

main().catch(console.error);
