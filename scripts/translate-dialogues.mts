#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const listeningDataDir = path.join(projectRoot, "src/lib/listening-data");

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

interface TextToTranslate {
  id: string;
  type: "title" | "line";
  lineIndex?: number;
  en: string;
}

// Simple mock translator for now (will be replaced with real API)
const textsToTranslate: TextToTranslate[] = [];

// Read all expansion files
const files = fs
  .readdirSync(listeningDataDir)
  .filter((f) => f.endsWith("expansion.ts"))
  .sort();

console.log(`Found ${files.length} dialogue files`);

let totalDialogues = 0;

for (const file of files) {
  const filePath = path.join(listeningDataDir, file);
  const content = fs.readFileSync(filePath, "utf-8");

  // Extract export statement
  const exportMatch = content.match(/export const (\w+):\s*Dialogue\[\]\s*=\s*\[([\s\S]*)\];/);
  if (!exportMatch) {
    console.log(`  ⚠ No dialogue export found in ${file}`);
    continue;
  }

  console.log(`Processing ${file}...`);

  // Simple approach: find all id: "..." and title: "..." patterns
  const dialogueMatches = content.matchAll(
    /\{\s*id:\s*"([^"]+)"[^}]*?situationKey:\s*"([^"]+)"[^}]*?level:\s*"([^"]+)"[^}]*?title:\s*"([^"]*?)"[^}]*?lines:/g
  );

  for (const match of dialogueMatches) {
    const id = match[1];
    const title = match[4];

    if (title) {
      textsToTranslate.push({
        id,
        type: "title",
        en: title,
      });
    }

    // Find all en: "..." lines for this dialogue
    // This is approximate - would need full parsing
  }

  totalDialogues += Array.from(
    content.matchAll(/id:\s*"[^"]+"/g)
  ).length;
}

console.log(`\nTotal dialogues found: ${totalDialogues}`);
console.log(`Texts to translate: ${textsToTranslate.length}`);

// Save extraction
const extractionFile = path.join(projectRoot, ".dialogue-extraction.json");
fs.writeFileSync(
  extractionFile,
  JSON.stringify(textsToTranslate, null, 2),
  "utf-8"
);
console.log(`Saved to ${extractionFile}`);
