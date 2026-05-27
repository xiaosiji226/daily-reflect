"""Export daily-reflect data to an Obsidian vault."""
import os
import re
import shutil
import sys
from pathlib import Path

# === CONFIG ===
SOURCE_DATA = Path(__file__).resolve().parent.parent / "server" / "data"
TARGET_VAULT = Path(r"C:\Users\10306\iCloudDrive\iCloud~md~obsidian\小司机\6. 回响")


def main():
    if not SOURCE_DATA.exists():
        print(f"Source data dir not found: {SOURCE_DATA}")
        sys.exit(1)

    entries_dir = SOURCE_DATA / "entries"
    images_dir = SOURCE_DATA / "images"

    target_attachments = TARGET_VAULT / "attachments"
    TARGET_VAULT.mkdir(parents=True, exist_ok=True)

    md_files = sorted(entries_dir.rglob("*.md"))
    if not md_files:
        print("No markdown files found to export.")
        return

    for md_path in md_files:
        date_str = md_path.stem  # e.g. "2026-05-26"
        print(f"Processing {date_str}...")

        content = md_path.read_text(encoding="utf-8")

        # Find all image references: ![](2026/05/n2-001.jpeg)
        img_pattern = re.compile(r'!\[\]\((\d{4}/\d{2}/[^)]+)\)')

        for match in img_pattern.finditer(content):
            img_rel = match.group(1)  # e.g. "2026/05/n2-001.jpeg"
            img_src = images_dir / img_rel
            img_filename = Path(img_rel).name  # e.g. "n2-001.jpeg"

            # Use date-specific subfolder to avoid name conflicts
            img_dst_dir = target_attachments / date_str
            img_dst_dir.mkdir(parents=True, exist_ok=True)
            img_dst = img_dst_dir / img_filename

            if img_src.exists():
                shutil.copy2(img_src, img_dst)
                new_ref = f"attachments/{date_str}/{img_filename}"
                content = content.replace(match.group(0), f"![]({new_ref})")
            else:
                print(f"  WARNING: Image not found: {img_src}")

        # Clean up: remove the "# 每日反思 — ..." title line (Obsidian uses filename)
        content = re.sub(r'^# 每日反思.*\n?', '', content, flags=re.MULTILINE)

        # Write to vault
        dst_path = TARGET_VAULT / f"{date_str}.md"
        dst_path.write_text(content, encoding="utf-8")

    print(f"\nDone! Exported {len(md_files)} entries to {TARGET_VAULT}")


if __name__ == "__main__":
    main()
