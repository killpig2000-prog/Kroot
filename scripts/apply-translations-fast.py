#!/usr/bin/env python3
"""
Fast translation application script.
Reads translations-complete.json and applies to all listening data files.
"""

import json
import re
from pathlib import Path
from typing import Dict

LISTENING_DATA_DIR = Path("/home/i0215743/App/Kroot/src/lib/listening-data")
TRANSLATIONS_FILE = Path("/tmp/claude-1000/-home-i0215743-App-Kroot/97b2b113-0139-4acd-88c7-6909d2648d47/scratchpad/translations-complete.json")

def load_translations() -> Dict[str, Dict[str, str]]:
    """Load translations from JSON file."""
    print(f"Loading translations from {TRANSLATIONS_FILE}...")
    with open(TRANSLATIONS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    translations = data.get("translations", {})
    print(f"  Japanese: {len(translations.get('ja', {}))} translations")
    print(f"  Chinese: {len(translations.get('zh', {}))} translations")
    print(f"  Vietnamese: {len(translations.get('vi', {}))} translations")
    return translations


def apply_translations_to_file(file_path: Path, translations: Dict[str, Dict[str, str]]) -> int:
    """Apply translations to a single file. Returns number of lines updated."""
    content = file_path.read_text(encoding="utf-8")
    original_content = content
    updates_count = 0

    # Pattern to find lines with empty translations: ja: "", zh: "", vi: ""
    # We need to be careful to match the exact pattern
    line_pattern = r'(\{\s*speaker:\s*"[^"]+",\s*kr:\s*"[^"]*",\s*en:\s*)"([^"]*)"(\s*,\s*ja:\s*)""\s*,\s*zh:\s*""\s*,\s*vi:\s*""(\s*\})'

    def replace_line(match):
        nonlocal updates_count
        prefix = match.group(1)
        en_text = match.group(2)
        middle = match.group(3)
        suffix = match.group(4)

        if not en_text:
            return match.group(0)

        # Get translations
        ja_trans = translations.get("ja", {}).get(en_text, "")
        zh_trans = translations.get("zh", {}).get(en_text, "")
        vi_trans = translations.get("vi", {}).get(en_text, "")

        if ja_trans or zh_trans or vi_trans:
            updates_count += 1
            return f'{prefix}"{en_text}"{middle}"{ja_trans}", zh: "{zh_trans}", vi: "{vi_trans}"{suffix}'

        return match.group(0)

    content = re.sub(line_pattern, replace_line, content)

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
    translations = load_translations()
    print()

    # Apply to all files
    ts_files = sorted(LISTENING_DATA_DIR.glob("*-expansion.ts"))
    print(f"Processing {len(ts_files)} files...\n")

    total_updates = 0
    files_updated = 0

    for ts_file in ts_files:
        try:
            updates = apply_translations_to_file(ts_file, translations)
            if updates > 0:
                files_updated += 1
                total_updates += updates
            print(f"✓ {ts_file.name:40} | {updates:4} lines updated")
        except Exception as e:
            print(f"✗ {ts_file.name:40} | Error: {e}")

    print()
    print("=" * 70)
    print(f"Files updated:       {files_updated}/{len(ts_files)}")
    print(f"Total lines updated: {total_updates}")
    print("=" * 70)


if __name__ == "__main__":
    main()
