import os
import glob
import shutil
from pathlib import Path
import aiofiles

from .base import StorageBackend
from ..utils import markdown_io


class MarkdownStorage(StorageBackend):
    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.entries_dir = self.data_dir / "entries"
        self.images_dir = self.data_dir / "images"

    def _get_entry_path(self, date_str: str) -> Path:
        year, month, day = date_str.split("-")
        return self.entries_dir / year / month / f"{date_str}.md"

    def _get_image_dir(self, date_str: str) -> Path:
        year, month, day = date_str.split("-")
        return self.images_dir / year / month

    async def day_exists(self, date_str: str) -> bool:
        return self._get_entry_path(date_str).exists()

    async def get_entry(self, date_str: str) -> dict | None:
        path = self._get_entry_path(date_str)
        if not path.exists():
            return None
        async with aiofiles.open(path, "r", encoding="utf-8") as f:
            content = await f.read()
        meta = markdown_io.parse_frontmatter(content)
        body = markdown_io.parse_body(content)
        return {"meta": meta, **body}

    async def list_entries(self) -> list[dict]:
        results = []
        pattern = str(self.entries_dir / "**" / "*.md")
        for path_str in glob.glob(pattern, recursive=True):
            path = Path(path_str)
            async with aiofiles.open(path, "r", encoding="utf-8") as f:
                content = await f.read()
            meta = markdown_io.parse_frontmatter(content)
            body = markdown_io.parse_body(content)
            summary_preview = body.get("summary", "")[:100] if body.get("summary") else ""

            # Collect keywords from all notes, deduplicate, keep order
            keywords: list[str] = []
            seen: set[str] = set()
            for note in body.get("notes", []):
                kw_str = note.get("keywords", "")
                if kw_str:
                    for kw in kw_str.replace("，", "、").replace(",", "、").split("、"):
                        kw = kw.strip()
                        if kw and kw not in seen:
                            seen.add(kw)
                            keywords.append(kw)

            results.append({
                "date": meta.get("date", ""),
                "note_count": len(body.get("notes", [])),
                "summary_preview": summary_preview,
                "keywords": keywords,
                "created_at": meta.get("created_at", ""),
            })
        results.sort(key=lambda x: x["date"], reverse=True)
        return results

    async def create_entry(self, date_str: str, meta: dict, body: str) -> None:
        path = self._get_entry_path(date_str)
        path.parent.mkdir(parents=True, exist_ok=True)
        full_content = markdown_io.dump_frontmatter(meta) + "\n" + body
        async with aiofiles.open(path, "w", encoding="utf-8") as f:
            await f.write(full_content)

    async def update_entry(self, date_str: str, meta: dict, body: str) -> None:
        path = self._get_entry_path(date_str)
        if not path.exists():
            raise FileNotFoundError(f"Entry not found: {date_str}")
        full_content = markdown_io.dump_frontmatter(meta) + "\n" + body
        async with aiofiles.open(path, "w", encoding="utf-8") as f:
            await f.write(full_content)

    async def delete_note(self, date_str: str, note_id: str) -> bool:
        entry = await self.get_entry(date_str)
        if not entry:
            return False
        notes = entry.get("notes", [])
        target = None
        for n in notes:
            if n["note_id"] == note_id:
                target = n
                break
        if not target:
            return False
        # Delete associated images
        for img_rel_path in target.get("images", []):
            img_abs = self.data_dir / "images" / img_rel_path
            if img_abs.exists():
                img_abs.unlink()
        notes.remove(target)
        return True

    async def delete_day(self, date_str: str) -> bool:
        path = self._get_entry_path(date_str)
        if not path.exists():
            return False
        # Delete all images for this day
        img_dir = self._get_image_dir(date_str)
        if img_dir.exists():
            shutil.rmtree(img_dir)
        path.unlink()
        return True
