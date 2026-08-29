#!/usr/bin/env python3
"""
Verify that all translations have been applied to listening data files.
Checks that ja, zh, vi fields are no longer empty.
"""

import re
from pathlib import Path
from typing import Dict, Tuple

LISTENING_DATA_DIR = Path("/home/i0215743/App/Kroot/src/lib/listening-data")

def check_file_completion(file_path: Path) -> Tuple[int, int, int]:
    """
    Check translation completion for a file.
    Returns: (total_lines, translated_lines, missing_translations)
    """
    content = file_path.read_text(encoding="utf-8")

    # Count all dialogue lines
    line_pattern = r'\{\s*speaker:\s*"[^"]+",\s*kr:\s*"[^"]*",\s*en:\s*"[^"]*",\s*ja:\s*"[^"]*",\s*zh:\s*"[^"]*",\s*vi:\s*"[^"]*"\s*\}'
    all_lines = re.findall(line_pattern, content)

    # Count lines with empty translations
    empty_pattern = r'\{\s*speaker:\s*"[^"]+",\s*kr:\s*"[^"]*",\s*en:\s*"[^"]*",\s*ja:\s*"",\s*zh:\s*"",\s*vi:\s*""\s*\}'
    empty_lines = re.findall(empty_pattern, content)

    total = len(all_lines)
    translated = total - len(empty_lines)
    missing = len(empty_lines)

    return total, translated, missing


def main():
    """Main verification function."""
    print("=" * 70)
    print("TRANSLATION VERIFICATION REPORT")
    print("=" * 70)
    print()

    ts_files = sorted(LISTENING_DATA_DIR.glob("*-expansion.ts"))

    total_lines = 0
    total_translated = 0
    total_missing = 0

    print("File Status:")
    print("-" * 70)

    for ts_file in ts_files:
        lines, translated, missing = check_file_completion(ts_file)
        total_lines += lines
        total_translated += translated
        total_missing += missing

        status = "COMPLETE" if missing == 0 else f"INCOMPLETE ({missing} missing)"
        print(f"{ts_file.name:40} | {translated:4}/{lines:4} | {status}")

    print("-" * 70)
    print(f"{'TOTAL':40} | {total_translated:4}/{total_lines:4}")
    print()

    completion_pct = (total_translated / total_lines * 100) if total_lines > 0 else 0
    print(f"Completion: {completion_pct:.1f}%")
    print(f"Remaining:  {total_missing} lines")
    print()

    if total_missing == 0:
        print("SUCCESS: All translations have been applied!")
    else:
        print(f"WARNING: {total_missing} lines still need translation")

    print("=" * 70)


if __name__ == "__main__":
    main()
