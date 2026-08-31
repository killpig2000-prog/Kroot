#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

type TargetLang = "ja" | "zh" | "vi" | "es";

type VocabWord = {
  korean: string;
  romanization: string;
  meaning_en: string;
  example_en: string;
};

const TARGET_LANGS: TargetLang[] = ["ja", "zh", "vi", "es"];
const BATCH_SIZE = 30;
const DELAY_MS = 3000;

function loadAllWords(): VocabWord[] {
  const vocabDir = "src/lib/vocabulary-data";
  const files = fs
    .readdirSync(vocabDir)
    .filter((f) => f.startsWith("daily-life-") && f.endsWith(".ts") && f !== "daily-life.ts")
    .map((f) => path.join(vocabDir, f));

  const words: VocabWord[] = [];
  const wordRegex =
    /\{\s*level:\s*"[^"]+",\s*korean:\s*"([^"]+)",\s*romanization:\s*"([^"]+)",\s*meaning_en:\s*"([^"]+)",\s*example_kr:\s*"[^"]*",\s*example_en:\s*"([^"]+)"/g;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    let match;
    while ((match = wordRegex.exec(content))) {
      words.push({
        korean: match[1],
        romanization: match[2],
        meaning_en: match[3],
        example_en: match[4],
      });
    }
  }

  return words;
}

async function translateBatch(
  words: VocabWord[],
  targetLang: TargetLang
): Promise<Record<string, { meaning: string; example: string }>> {
  const langName: Record<TargetLang, string> = {
    ja: "Japanese",
    zh: "Simplified Chinese",
    vi: "Vietnamese",
    es: "Spanish",
  };

  const prompt = `Translate these ${words.length} Korean vocabulary words into ${langName[targetLang]}. Translate BOTH the meaning and the example sentence fully into that language. Keep translations natural for learners.

Words:
${words.map((w) => `• ${w.korean}: meaning="${w.meaning_en}" | example="${w.example_en}"`).join("\n")}

Respond with ONLY a JSON object mapping each Korean word to {meaning, example}. No other text.`;

  try {
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!response.response?.text) {
      console.error(`[${targetLang}] Empty response`);
      return {};
    }

    const text = response.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[${targetLang}] No JSON found`);
      return {};
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`[${targetLang}] Error:`, (error as Error).message);
    return {};
  }
}

async function main() {
  console.log("Loading vocabulary...");
  const words = loadAllWords();
  console.log(`Loaded ${words.length} words\n`);

  const outDir = "src/lib/vocabulary-data/i18n-overrides";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const lang of TARGET_LANGS) {
    console.log(`\n=== Translating to ${lang.toUpperCase()} ===`);
    const allTranslations: Record<string, { meaning: string; example: string }> = {};

    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      const batch = words.slice(i, Math.min(i + BATCH_SIZE, words.length));
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(words.length / BATCH_SIZE);

      console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} words)...`);
      const batchTranslations = await translateBatch(batch, lang);
      Object.assign(allTranslations, batchTranslations);
      console.log(`    ✓ ${Object.keys(batchTranslations).length} translated`);

      if (i + BATCH_SIZE < words.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    const outputFile = path.join(outDir, `${lang}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(allTranslations, null, 2));
    console.log(`✓ Saved ${Object.keys(allTranslations).length} / ${words.length} to ${outputFile}`);
  }

  console.log("\n✓ All translations complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
