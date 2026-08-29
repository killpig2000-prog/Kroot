#!/usr/bin/env node
/**
 * Translate 4,111 vocabulary words (meaning + example sentence) to Spanish,
 * Japanese, Chinese (Simplified), Vietnamese in parallel.
 * Generates messages/{locale}/{level}_{korean}.json overlay files.
 */

import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY env var not set');
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env vars not set');

const TARGET_LANGUAGES = ['es', 'ja', 'zh-Hans', 'vi'] as const;
const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish (Latin American)',
  ja: 'Japanese',
  'zh-Hans': 'Chinese (Simplified)',
  vi: 'Vietnamese',
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const BATCH_SIZE = 20;
const CONCURRENCY = 3;

interface VocabWord {
  korean: string;
  romanization: string;
  meaning_en: string;
  example_kr: string;
  example_en: string;
  level: string;
}

interface TranslatedWord {
  korean: string;
  meaning: string;
  example: string;
}

async function fetchVocabulary(): Promise<VocabWord[]> {
  console.log('📚 Fetching vocabulary from Supabase...');
  const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);

  const { data, error } = await supabase
    .from('vocabulary')
    .select('korean, romanization, meaning_en, example_kr, example_en, level')
    .order('level')
    .order('korean');

  if (error) throw new Error(`Supabase fetch failed: ${error.message}`);
  console.log(`✓ Fetched ${data?.length || 0} words\n`);
  return data || [];
}

async function translateBatch(
  words: VocabWord[],
  targetLang: string
): Promise<TranslatedWord[]> {
  const langName = LANGUAGE_NAMES[targetLang];

  const prompt = `You are a professional translator specializing in Korean language education.
Translate these Korean vocabulary words and example sentences to ${langName}.
Keep translations concise, natural, and appropriate for language learners.
${targetLang === 'ja' ? 'Use hiragana for particles and helper words.' : ''}
${targetLang === 'zh-Hans' ? 'Use Simplified Chinese.' : ''}
Return ONLY valid JSON array, no markdown or explanation.

Words to translate (JSON array):
${JSON.stringify(
  words.map((w) => ({
    korean: w.korean,
    romanization: w.romanization,
    meaning_en: w.meaning_en,
    example_kr: w.example_kr,
    example_en: w.example_en,
  })),
  null,
  2
)}

Return an array of objects with {korean, meaning, example} fields in ${langName}:`;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, topP: 0.95 },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err.substring(0, 200)}`);
  }

  const data = await response.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response text from Gemini');

  // Extract JSON array
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`Could not extract JSON from response`);

  return JSON.parse(jsonMatch[0]) as TranslatedWord[];
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateLanguage(
  words: VocabWord[],
  targetLang: string
) {
  console.log(`\n🌍 Translating ${LANGUAGE_NAMES[targetLang]} (${words.length} words)...\n`);

  const results: Record<string, any> = {};
  let completed = 0;

  for (let i = 0; i < words.length; i += BATCH_SIZE * CONCURRENCY) {
    const batchGroups = [];
    for (let c = 0; c < CONCURRENCY && i + c * BATCH_SIZE < words.length; c++) {
      const start = i + c * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, words.length);
      batchGroups.push(words.slice(start, end));
    }

    const promises = batchGroups.map((batch) => translateBatch(batch, targetLang));
    const batchResults = await Promise.all(promises);

    for (const batch of batchResults) {
      for (const item of batch) {
        const key = `${item.korean}`;
        results[key] = {
          meaning: item.meaning,
          example: item.example,
        };
        completed++;
        if (completed % 100 === 0) {
          console.log(`  ${completed}/${words.length} words translated`);
        }
      }
    }

    // Rate limiting
    await sleep(1000);
  }

  // Write to JSON file
  const filePath = path.join('src', 'lib', 'vocabulary-data', 'i18n-overrides', `${targetLang}.json`);
  await fs.writeFile(filePath, JSON.stringify(results, null, 2));
  console.log(`✓ Written to ${filePath} (${Object.keys(results).length} entries)\n`);
}

async function main() {
  try {
    console.log('🚀 Starting vocabulary translation for all languages\n');

    const allWords = await fetchVocabulary();

    // Translate each language in parallel
    const promises = TARGET_LANGUAGES.map((lang) => translateLanguage(allWords, lang));
    await Promise.all(promises);

    console.log('✅ All vocabulary translations completed!');
  } catch (err) {
    console.error('❌ Translation failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
