#!/usr/bin/env node
/**
 * Translate UI messages to Spanish, Japanese, Chinese (Simplified), Vietnamese.
 * Reads messages/en/*.json, translates to 4 languages in parallel via Gemini,
 * writes to messages/{es,ja,zh-Hans,vi}/*.json.
 */

import fs from 'fs/promises';
import path from 'path';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY env var not set');
}

const TARGET_LANGUAGES = ['es', 'ja', 'zh-Hans', 'vi'] as const;
const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish (Latin American)',
  ja: 'Japanese',
  'zh-Hans': 'Chinese (Simplified)',
  vi: 'Vietnamese',
};

const NAMESPACES = ['common', 'nav', 'onboarding', 'vocabulary', 'words'];

async function translateJson(
  englishJson: Record<string, string>,
  targetLang: string
) {
  const langName = LANGUAGE_NAMES[targetLang];
  const entries = Object.entries(englishJson);

  const prompt = `You are a professional translator specializing in educational apps.
Translate the following English UI strings to ${langName}.
Keep translations concise, natural, and consistent with app UI conventions.
Return ONLY a valid JSON object with the same keys, no markdown, no explanation.

English strings to translate:
${JSON.stringify(englishJson, null, 2)}

Return the ${langName} translations as JSON:`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, topP: 0.95 },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response text from Gemini');

  // Extract JSON from response (may be wrapped in markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Could not extract JSON from response: ${text.substring(0, 500)}`);

  return JSON.parse(jsonMatch[0]) as Record<string, string>;
}

async function main() {
  console.log('📍 Translating UI messages to 4 languages...\n');

  // Read all English message files
  const englishMessages: Record<string, Record<string, string>> = {};
  for (const ns of NAMESPACES) {
    const filePath = path.join('messages', 'en', `${ns}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    englishMessages[ns] = JSON.parse(content);
  }

  // Translate each namespace to each target language (in parallel)
  const translations: Record<string, Record<string, Record<string, string>>> = {};
  for (const lang of TARGET_LANGUAGES) {
    translations[lang] = {};
  }

  for (const ns of NAMESPACES) {
    console.log(`\n🔄 Translating "${ns}" namespace...`);
    const englishJson = englishMessages[ns];

    const promises = TARGET_LANGUAGES.map(async (lang) => {
      try {
        console.log(`  → ${LANGUAGE_NAMES[lang]}...`);
        const translated = await translateJson(englishJson, lang);
        translations[lang][ns] = translated;
        console.log(`  ✓ ${LANGUAGE_NAMES[lang]} done`);
      } catch (err) {
        console.error(`  ✗ ${LANGUAGE_NAMES[lang]} failed:`, err);
        throw err;
      }
    });

    await Promise.all(promises);
  }

  // Write translations to files
  console.log('\n📝 Writing translated files...\n');
  for (const lang of TARGET_LANGUAGES) {
    const langDir = path.join('messages', lang);
    await fs.mkdir(langDir, { recursive: true });

    for (const ns of NAMESPACES) {
      const filePath = path.join(langDir, `${ns}.json`);
      const translated = translations[lang][ns];
      await fs.writeFile(filePath, JSON.stringify(translated, null, 2));
      console.log(`✓ messages/${lang}/${ns}.json`);
    }
  }

  console.log('\n✅ All UI messages translated successfully!');
}

main().catch((err) => {
  console.error('❌ Translation failed:', err.message);
  process.exit(1);
});
