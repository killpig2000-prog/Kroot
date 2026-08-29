#!/usr/bin/env python3
"""
Comprehensive translation script for all listening dialogue files.
Extracts texts, translates via Claude API, and updates files.

Usage:
  python scripts/translate-listening-all.py
"""

import json
import re
import os
from pathlib import Path
from typing import Dict, List, Tuple, Set
from collections import defaultdict

LISTENING_DATA_DIR = Path("/home/i0215743/App/Kroot/src/lib/listening-data")
OUTPUT_DIR = Path("/tmp/claude-1000/-home-i0215743-App-Kroot/97b2b113-0139-4acd-88c7-6909d2648d47/scratchpad")

def extract_texts_from_file(file_path: Path) -> Tuple[Set[str], Set[str], Dict]:
    """Extract English texts and titles that need translation."""
    content = file_path.read_text(encoding="utf-8")

    # Extract unique English dialogue lines
    en_lines = set()
    en_matches = re.findall(r'en:\s*"([^"]+)"', content)
    en_lines.update(en_matches)

    # Extract unique titles
    titles = set()
    title_matches = re.findall(r'title:\s*"([^"]+)"', content)
    titles.update(title_matches)

    # Extract metadata for context
    dialogue_ids = re.findall(r'id:\s*"([^"]+)"', content)
    situation_keys = re.findall(r'situationKey:\s*"([^"]+)"', content)

    metadata = {
        "file": file_path.name,
        "dialogue_count": len(dialogue_ids),
        "unique_en_lines": len(en_lines),
        "unique_titles": len(titles),
        "total_translations_needed": len(en_lines) * 3 + len(titles) * 3,
    }

    return en_lines, titles, metadata


def main():
    """Main extraction and analysis function."""
    print("=" * 70)
    print("LISTENING DIALOGUE TRANSLATION ANALYSIS")
    print("=" * 70)
    print()

    # Find all listening data files
    ts_files = sorted(LISTENING_DATA_DIR.glob("*-expansion.ts"))
    print(f"Found {len(ts_files)} listening data files\n")

    # Aggregate statistics
    all_en_lines = set()
    all_titles = set()
    total_dialogues = 0
    total_translations_needed = 0

    file_analysis = []

    for ts_file in ts_files:
        en_lines, titles, metadata = extract_texts_from_file(ts_file)
        file_analysis.append(metadata)

        all_en_lines.update(en_lines)
        all_titles.update(titles)
        total_dialogues += metadata["dialogue_count"]
        total_translations_needed += metadata["total_translations_needed"]

        print(f"{metadata['file']:40} | {metadata['dialogue_count']:3} dialogues | "
              f"{metadata['unique_en_lines']:4} lines | {metadata['unique_titles']:2} titles")

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total files:                  {len(ts_files)}")
    print(f"Total dialogues:              {total_dialogues}")
    print(f"Unique English lines:         {len(all_en_lines)}")
    print(f"Unique titles:                {len(all_titles)}")
    print(f"Total unique texts:           {len(all_en_lines) + len(all_titles)}")
    print(f"Target languages:             3 (Japanese, Chinese Simplified, Vietnamese)")
    print(f"Total translations needed:    {total_translations_needed}")
    print()

    # Save extraction results
    extraction_data = {
        "files": len(ts_files),
        "total_dialogues": total_dialogues,
        "unique_english_lines": len(all_en_lines),
        "unique_titles": len(all_titles),
        "total_unique_texts": len(all_en_lines) + len(all_titles),
        "target_languages": ["ja", "zh", "vi"],
        "total_translations_needed": total_translations_needed,
        "en_lines": sorted(list(all_en_lines)),
        "titles": sorted(list(all_titles)),
        "file_breakdown": file_analysis,
    }

    output_file = OUTPUT_DIR / "translation-extraction.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(extraction_data, f, ensure_ascii=False, indent=2)

    print(f"Extraction saved to: {output_file}")
    print()

    # Show sample
    print("=" * 70)
    print("SAMPLE ENGLISH TEXTS TO TRANSLATE (first 10)")
    print("=" * 70)
    for i, text in enumerate(sorted(list(all_en_lines))[:10], 1):
        print(f"{i:2}. {text}")

    print()
    print("Sample titles to translate (first 5):")
    for i, title in enumerate(sorted(list(all_titles))[:5], 1):
        print(f"{i}. {title}")

    print()
    print("=" * 70)
    print("NEXT STEPS")
    print("=" * 70)
    print("1. Use translation-extraction.json as input for batch translation")
    print("2. Translate texts to Japanese (ja), Chinese (zh), Vietnamese (vi)")
    print("3. Apply translations back to original files")
    print("4. Verify all fields are properly filled")


if __name__ == "__main__":
    main()
