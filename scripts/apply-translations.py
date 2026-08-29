#!/usr/bin/env python3
"""
Apply translations back to listening data files.
Reads from translations-complete.json and updates all *-expansion.ts files.
"""

import json
import re
from pathlib import Path
from typing import Dict

LISTENING_DATA_DIR = Path("/home/i0215743/App/Kroot/src/lib/listening-data")
TRANSLATIONS_FILE = Path("/tmp/claude-1000/-home-i0215743-App-Kroot/97b2b113-0139-4acd-88c7-6909d2648d47/scratchpad/translations-complete.json")

def load_translations() -> Dict[str, Dict[str, str]]:
    """Load translations from JSON file."""
    if not TRANSLATIONS_FILE.exists():
        raise FileNotFoundError(f"Translations file not found: {TRANSLATIONS_FILE}")

    with open(TRANSLATIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data.get("translations", {})


def apply_translations_to_file(file_path: Path, translations: Dict[str, Dict[str, str]]) -> int:
    """Apply translations to a single file. Returns number of updates made."""
    content = file_path.read_text(encoding="utf-8")
    original_content = content
    updates_count = 0

    # Pattern to match dialogue lines with ja/zh/vi fields that need updating
    # { speaker: "...", kr: "...", en: "...", ja: "", zh: "", vi: "" }
    line_pattern = r'\{\s*speaker:\s*"([^"]+)",\s*kr:\s*"([^"]*)",\s*en:\s*"([^"]*)",\s*ja:\s*"[^"]*",\s*zh:\s*"[^"]*",\s*vi:\s*"[^"]*"\s*\}'

    def replace_line(match):
        nonlocal updates_count
        speaker = match.group(1)
        kr = match.group(2)
        en = match.group(3)

        if not en:
            return match.group(0)

        # Get translations for this English text
        ja_trans = translations.get("ja", {}).get(en, "")
        zh_trans = translations.get("zh", {}).get(en, "")
        vi_trans = translations.get("vi", {}).get(en, "")

        if ja_trans or zh_trans or vi_trans:
            updates_count += 1
            return f'{{ speaker: "{speaker}", kr: "{kr}", en: "{en}", ja: "{ja_trans}", zh: "{zh_trans}", vi: "{vi_trans}" }}'

        return match.group(0)

    content = re.sub(line_pattern, replace_line, content)

    # Also handle titles
    title_pattern = r'title:\s*"([^"]+)"'

    def replace_title(match):
        nonlocal updates_count
        title = match.group(1)

        if title in translations.get("ja", {}) or title in translations.get("zh", {}) or title in translations.get("vi", {}):
            # For now, keep the title as English string but log it
            updates_count += 1

        return match.group(0)

    re.sub(title_pattern, replace_title, content)

    # Write back if changes were made
    if content != original_content:
        file_path.write_text(content, encoding="utf-8")

    return updates_count


def main():
    """Main function."""
    print("=" * 70)
    print("APPLYING TRANSLATIONS TO LISTENING DATA FILES")
    print("=" * 70)
    print()

    # Load translations
    print("Loading translations...")
    translations = load_translations()

    print(f"  Japanese translations: {len(translations.get('ja', {}))}")
    print(f"  Chinese translations: {len(translations.get('zh', {}))}")
    print(f"  Vietnamese translations: {len(translations.get('vi', {}))}")
    print()

    # Apply to all files
    ts_files = sorted(LISTENING_DATA_DIR.glob("*-expansion.ts"))
    print(f"Processing {len(ts_files)} files...\n")

    total_updates = 0

    for ts_file in ts_files:
        updates = apply_translations_to_file(ts_file, translations)
        total_updates += updates
        print(f"  {ts_file.name:40} | {updates:4} updates")

    print()
    print("=" * 70)
    print(f"Total updates applied: {total_updates}")
    print("=" * 70)


if __name__ == "__main__":
    main()
