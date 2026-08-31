#!/usr/bin/env node
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

type TargetLang = "ja" | "zh" | "vi" | "es";

type GrammarLesson = {
  key: string;
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    explanation: string;
  }>;
  quiz: Array<{
    q: string;
    opts: string[];
  }>;
};

const TARGET_LANGS: TargetLang[] = ["ja", "zh", "vi", "es"];
const BATCH_SIZE = 5;
const DELAY_MS = 2000;

function loadGrammarLessons(): GrammarLesson[] {
  const grammarFile = "src/lib/grammar.ts";
  const content = fs.readFileSync(grammarFile, "utf-8");

  // Extract RAW_LESSONS array - this is complex, so we'll use a simpler approach
  // We'll require the grammar module and extract lessons
  const grammarModule = require("../src/lib/grammar.ts");

  // For now, we'll manually export what we need from grammar.ts
  // This will be filled in after we understand the actual structure
  const lessons: GrammarLesson[] = [];

  // Parse the TypeScript file to extract lessons
  const lessonMatches = content.matchAll(
    /{\s*key:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*krTitle:[^,]+,\s*level:[^,]+,\s*summary:\s*"([^"]+)",\s*sections:\s*\[([\s\S]*?)\],\s*quiz:/g
  );

  for (const match of lessonMatches) {
    const [, key, title, summary] = match;

    lessons.push({
      key,
      title,
      summary,
      sections: [],
      quiz: [],
    });
  }

  return lessons;
}

async function translateBatch(
  lessons: GrammarLesson[],
  targetLang: TargetLang
): Promise<Record<string, any>> {
  const langName: Record<TargetLang, string> = {
    ja: "Japanese",
    zh: "Simplified Chinese",
    vi: "Vietnamese",
    es: "Spanish",
  };

  const lessonsText = lessons
    .map((l) => {
      const sectionText = l.sections
        .map((s, i) => `Section ${i + 1} heading: ${s.heading}\nExplanation: ${s.explanation}`)
        .join("\n");

      const quizText = l.quiz
        .map((q) => `Question: ${q.q}\nOptions: ${q.opts.join(" | ")}`)
        .join("\n");

      return `Lesson: ${l.key}\nTitle: ${l.title}\nSummary: ${l.summary}\n${sectionText}\n${quizText}`;
    })
    .join("\n\n---\n\n");

  const prompt = `Translate these ${lessons.length} Korean grammar lessons into ${langName[targetLang]}. Translate ONLY the English text (title, summary, section headings, explanations, quiz questions). Do NOT translate Korean examples or Korean text.

${lessonsText}

Respond with a JSON object mapping lesson keys to {title, summary, sections: [{heading, explanation}], quiz: [{q, opts}]}. Return ONLY valid JSON, no other text.`;

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
  console.log("Loading grammar lessons...");
  const lessons = loadGrammarLessons();
  console.log(`Loaded ${lessons.length} lessons\n`);

  if (lessons.length === 0) {
    console.error("ERROR: Could not extract lessons from grammar.ts");
    process.exit(1);
  }

  const outDir = "src/lib/grammar-i18n-overrides";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const lang of TARGET_LANGS) {
    console.log(`\n=== Translating to ${lang.toUpperCase()} ===`);
    const allTranslations: Record<string, any> = {};

    for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
      const batch = lessons.slice(i, Math.min(i + BATCH_SIZE, lessons.length));
      console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(lessons.length / BATCH_SIZE)} (${batch.length} lessons)...`);

      const translations = await translateBatch(batch, lang);
      Object.assign(allTranslations, translations);

      if (i + BATCH_SIZE < lessons.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    const outFile = path.join(outDir, `${lang}.json`);
    fs.writeFileSync(outFile, JSON.stringify(allTranslations, null, 2), "utf-8");
    console.log(`  ✓ Written ${Object.keys(allTranslations).length} lessons to ${outFile}`);
  }

  console.log("\n=== Grammar translation complete ===\n");
}

main().catch(console.error);
