#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

type TargetLang = "ja" | "zh" | "vi" | "es";

type DialogueLine = {
  speaker: string;
  en: string;
};

type DialogueData = {
  id: string;
  title: string;
  lines: DialogueLine[];
};

// Filter languages based on TRANSLATE_LANGS env var (comma-separated), defaults to all
const envLangs = process.env.TRANSLATE_LANGS;
const TARGET_LANGS: TargetLang[] = envLangs
  ? (envLangs.split(",") as TargetLang[])
  : ["ja", "zh", "vi", "es"];
const BATCH_SIZE = 8;
const DELAY_MS = 2000;

function loadAllDialogues(): DialogueData[] {
  const dataDir = "src/lib/listening-data";
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith("-expansion.ts"))
    .map((f) => path.join(dataDir, f));

  const dialogues: DialogueData[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");

    // Extract dialogue objects from the TypeScript file
    const dialogueRegex =
      /\{\s*id:\s*"([^"]+)",\s*situationKey:[^,]+,\s*level:[^,]+,\s*title:\s*"([^"]+)",\s*lines:\s*\[([\s\S]*?)\]\s*\},?/g;

    let match;
    while ((match = dialogueRegex.exec(content))) {
      const [, id, title, linesStr] = match;

      // Extract lines
      const lines: DialogueLine[] = [];
      const lineRegex = /\{\s*speaker:\s*"([^"]+)",\s*kr:\s*"[^"]*",\s*en:\s*"([^"]*)"[^}]*\}/g;

      let lineMatch;
      while ((lineMatch = lineRegex.exec(linesStr))) {
        const [, speaker, en] = lineMatch;
        if (en) {
          lines.push({ speaker, en });
        }
      }

      if (lines.length > 0) {
        dialogues.push({ id, title, lines });
      }
    }
  }

  return dialogues;
}

async function translateBatch(
  dialogues: DialogueData[],
  targetLang: TargetLang
): Promise<Record<string, any>> {
  const langName: Record<TargetLang, string> = {
    ja: "Japanese",
    zh: "Simplified Chinese",
    vi: "Vietnamese",
    es: "Spanish",
  };

  const dialoguesText = dialogues
    .map((d) => {
      const linesText = d.lines
        .map((l) => `${l.speaker}: ${l.en}`)
        .join("\n");
      return `DIALOGUE: ${d.id}\nTitle: ${d.title}\n${linesText}`;
    })
    .join("\n\n---\n\n");

  const prompt = `Translate these ${dialogues.length} English dialogue passages into ${langName[targetLang]}. Translate ONLY the English text (titles and speaker lines). Do NOT translate speaker names.

For each dialogue, provide translations for the title and all speaker lines. Keep translations natural and conversational.

${dialoguesText}

Respond with ONLY a JSON object mapping dialogue IDs to their translations in this format:
{
  "dialogue-id": {
    "title": "translated title",
    "lines": [
      {"speaker": "speaker name", "en": "translated line"},
      ...
    ]
  },
  ...
}

Return only the JSON object, no other text.`;

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
      console.error(`[${targetLang}] No JSON found in response`);
      return {};
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error(`[${targetLang}] Error:`, (error as Error).message);
    return {};
  }
}

async function translateLanguage(lang: TargetLang, dialogues: DialogueData[]) {
  console.log(`\n=== Translating to ${lang.toUpperCase()} ===`);
  const allTranslations: Record<string, any> = {};

  for (let i = 0; i < dialogues.length; i += BATCH_SIZE) {
    const batch = dialogues.slice(
      i,
      Math.min(i + BATCH_SIZE, dialogues.length)
    );
    console.log(
      `  [${lang}] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
        dialogues.length / BATCH_SIZE
      )} (${batch.length} dialogues)...`
    );

    const translations = await translateBatch(batch, lang);
    Object.assign(allTranslations, translations);

    if (i + BATCH_SIZE < dialogues.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  const outDir = "src/lib/listening-i18n-overrides";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `${lang}.json`);
  fs.writeFileSync(outFile, JSON.stringify(allTranslations, null, 2), "utf-8");
  console.log(
    `  ✓ [${lang}] Written ${Object.keys(allTranslations).length} dialogues to ${outFile}`
  );

  return { lang, count: Object.keys(allTranslations).length };
}

async function main() {
  console.log("Loading listening dialogues...");
  const dialogues = loadAllDialogues();
  console.log(`Loaded ${dialogues.length} dialogues\n`);

  if (dialogues.length === 0) {
    console.error("ERROR: Could not extract dialogues from listening-data files");
    process.exit(1);
  }

  console.log("Starting parallel translation for all languages...");
  const results = await Promise.all(
    TARGET_LANGS.map((lang) => translateLanguage(lang, dialogues))
  );

  console.log("\n=== Listening translation complete ===");
  results.forEach((r) => {
    console.log(`  ${r.lang.toUpperCase()}: ${r.count} dialogues`);
  });
}

main().catch(console.error);
