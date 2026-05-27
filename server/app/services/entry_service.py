from fastapi import UploadFile

from ..config import Settings
from ..storage.base import StorageBackend
from ..storage.markdown_storage import MarkdownStorage
from ..utils import date_utils, markdown_io
from .image_service import ImageService


class EntryNotFoundError(Exception):
    pass


class NoteNotFoundError(Exception):
    pass


class EntryService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.storage: StorageBackend = MarkdownStorage(settings.data_dir)
        self.image_service = ImageService(settings)

    def _note_id_gen(self, date_str: str, existing_ids: set[str]) -> str:
        """Generate the next note_id (n1, n2, n3...) for a given date."""
        i = 1
        while True:
            nid = f"n{i}"
            if nid not in existing_ids:
                return nid
            i += 1

    def _resolve_image_urls(self, note: dict) -> list[str]:
        """Convert relative image paths to API URLs."""
        return [f"/api/images/{path}" for path in note.get("images", [])]

    def _entry_to_detail(self, date_str: str, entry: dict) -> dict:
        """Convert raw entry data to API response format."""
        notes = []
        for n in entry.get("notes", []):
            notes.append({
                "note_id": n["note_id"],
                "time": n["time"],
                "text": n["text"],
                "images": self._resolve_image_urls(n),
                "keywords": n.get("keywords", ""),
            })
        return {
            "date": date_str,
            "notes": notes,
            "summary": entry.get("summary", ""),
            "discussion": entry.get("discussion", []),
            "created_at": entry.get("meta", {}).get("created_at", ""),
            "updated_at": entry.get("meta", {}).get("updated_at", ""),
        }

    async def add_note(
        self, text: str, images: list[UploadFile], date_str: str | None = None
    ) -> dict:
        date_str = date_str or date_utils.today_str()
        if not date_utils.is_valid_date(date_str):
            raise ValueError(f"无效的日期格式: {date_str}")

        entry = await self.storage.get_entry(date_str)
        is_new_day = entry is None

        if is_new_day:
            existing_ids = set()
        else:
            existing_ids = {n["note_id"] for n in entry.get("notes", [])}

        note_id = self._note_id_gen(date_str, existing_ids)
        time_str = date_utils.now_time_str()
        now_iso = date_utils.now_iso()

        # Save images
        image_paths = []
        for seq, file in enumerate(images):
            if file.filename:
                rel_path = await self.image_service.save(file, date_str, note_id, seq + 1)
                image_paths.append(rel_path)

        new_note = {
            "note_id": note_id,
            "time": time_str,
            "text": text,
            "images": image_paths,
        }

        if is_new_day:
            notes = [new_note]
            summary = ""
            discussion = []
            meta = {"date": date_str, "created_at": now_iso, "updated_at": now_iso}
            body = markdown_io.build_entry_body(notes, summary, discussion, date_str)
            await self.storage.create_entry(date_str, meta, body)
        else:
            notes = entry.get("notes", []) + [new_note]
            summary = entry.get("summary", "")
            discussion = entry.get("discussion", [])
            meta = entry.get("meta", {})
            meta["updated_at"] = now_iso
            body = markdown_io.build_entry_body(notes, summary, discussion, date_str)
            await self.storage.update_entry(date_str, meta, body)

        entry = await self.storage.get_entry(date_str)
        return self._entry_to_detail(date_str, entry)

    async def get_entry(self, date_str: str) -> dict:
        entry = await self.storage.get_entry(date_str)
        if not entry:
            raise EntryNotFoundError(f"未找到 {date_str} 的记录")
        return self._entry_to_detail(date_str, entry)

    async def list_entries(self) -> list[dict]:
        return await self.storage.list_entries()

    async def delete_note(self, date_str: str, note_id: str) -> dict:
        entry = await self.storage.get_entry(date_str)
        if not entry:
            raise EntryNotFoundError(f"未找到 {date_str} 的记录")

        notes = entry.get("notes", [])
        target = None
        for n in notes:
            if n["note_id"] == note_id:
                target = n
                break
        if not target:
            raise NoteNotFoundError(f"未找到笔记 {note_id}")

        # Delete associated image files
        for img_rel_path in target.get("images", []):
            img_abs = self.image_service.data_dir / img_rel_path
            if img_abs.exists():
                img_abs.unlink()

        notes.remove(target)
        summary = entry.get("summary", "")
        discussion = entry.get("discussion", [])
        meta = entry.get("meta", {})
        meta["updated_at"] = date_utils.now_iso()

        body = markdown_io.build_entry_body(notes, summary, discussion, date_str)
        await self.storage.update_entry(date_str, meta, body)

        # Re-read to return fresh data
        updated_entry = await self.storage.get_entry(date_str)
        return self._entry_to_detail(date_str, updated_entry)

    async def update_summary(self, date_str: str, new_summary: str) -> dict:
        entry = await self.storage.get_entry(date_str)
        if not entry:
            raise EntryNotFoundError(f"未找到 {date_str} 的记录")

        meta = entry.get("meta", {})
        meta["updated_at"] = date_utils.now_iso()
        body = markdown_io.build_entry_body(
            entry.get("notes", []), new_summary, entry.get("discussion", []), date_str
        )
        await self.storage.update_entry(date_str, meta, body)

        updated = await self.storage.get_entry(date_str)
        return self._entry_to_detail(date_str, updated)

    async def update_keywords(self, date_str: str, note_keywords: dict[str, str]) -> dict:
        entry = await self.storage.get_entry(date_str)
        if not entry:
            raise EntryNotFoundError(f"未找到 {date_str} 的记录")

        for note in entry.get("notes", []):
            nid = note["note_id"]
            if nid in note_keywords:
                note["keywords"] = note_keywords[nid]

        meta = entry.get("meta", {})
        meta["updated_at"] = date_utils.now_iso()
        body = markdown_io.build_entry_body(
            entry.get("notes", []), entry.get("summary", ""), entry.get("discussion", []), date_str
        )
        await self.storage.update_entry(date_str, meta, body)

        updated = await self.storage.get_entry(date_str)
        return self._entry_to_detail(date_str, updated)

    async def add_opener(self, date_str: str, opener: str) -> dict:
        """Add an AI-only opener message to the discussion."""
        entry = await self.storage.get_entry(date_str)
        if not entry:
            raise EntryNotFoundError(f"未找到 {date_str} 的记录")

        time_str = date_utils.now_time_str()
        discussion = entry.get("discussion", [])
        discussion.append({"role": "ai", "time": time_str, "content": opener})

        meta = entry.get("meta", {})
        meta["updated_at"] = date_utils.now_iso()
        body = markdown_io.build_entry_body(
            entry.get("notes", []), entry.get("summary", ""), discussion, date_str
        )
        await self.storage.update_entry(date_str, meta, body)

        updated = await self.storage.get_entry(date_str)
        return self._entry_to_detail(date_str, updated)

    async def add_discussion_message(self, date_str: str, user_message: str, ai_reply: str) -> dict:
        entry = await self.storage.get_entry(date_str)
        if not entry:
            raise EntryNotFoundError(f"未找到 {date_str} 的记录")

        time_str = date_utils.now_time_str()
        discussion = entry.get("discussion", [])
        discussion.append({"role": "user", "time": time_str, "content": user_message})
        discussion.append({"role": "ai", "time": time_str, "content": ai_reply})

        meta = entry.get("meta", {})
        meta["updated_at"] = date_utils.now_iso()
        body = markdown_io.build_entry_body(
            entry.get("notes", []), entry.get("summary", ""), discussion, date_str
        )
        await self.storage.update_entry(date_str, meta, body)

        updated = await self.storage.get_entry(date_str)
        return self._entry_to_detail(date_str, updated)

    async def clear_discussion(self, date_str: str) -> dict:
        """Clear the discussion history for a date."""
        entry = await self.storage.get_entry(date_str)
        if not entry:
            raise EntryNotFoundError(f"未找到 {date_str} 的记录")

        meta = entry.get("meta", {})
        meta["updated_at"] = date_utils.now_iso()
        body = markdown_io.build_entry_body(
            entry.get("notes", []), entry.get("summary", ""), [], date_str
        )
        await self.storage.update_entry(date_str, meta, body)

        updated = await self.storage.get_entry(date_str)
        return self._entry_to_detail(date_str, updated)

    def build_context_for_summary(self, entry: dict) -> str:
        """Build the context string for AI summarization from all notes."""
        notes = entry.get("notes", [])
        parts = []
        for n in notes:
            parts.append(f"【{n['time']}】{n['text']}")
        return "\n".join(parts)

    def build_context_for_discuss(self, entry: dict) -> str:
        """Build the full context for AI discussion."""
        notes_context = self.build_context_for_summary(entry)
        summary = entry.get("summary", "")

        discussion = entry.get("discussion", [])
        disc_lines = []
        for msg in discussion:
            role = "用户" if msg["role"] == "user" else "思语"
            disc_lines.append(f"{role}({msg['time']}): {msg['content']}")

        parts = []
        parts.append("## 今日笔记")
        parts.append(notes_context)
        if summary:
            parts.append("\n## 今日总结")
            parts.append(summary)
        if disc_lines:
            parts.append("\n## 已有讨论")
            parts.extend(disc_lines)
        return "\n".join(parts)
