from typing import Optional
from fastapi import APIRouter, BackgroundTasks, File, Form, UploadFile, Depends, HTTPException

from ..config import Settings
from ..services.entry_service import EntryService, EntryNotFoundError, NoteNotFoundError
from ..services.gemini_service import GeminiService
from ..utils import date_utils

router = APIRouter(prefix="/api/entries", tags=["entries"])

_entry_service: EntryService | None = None
_gemini_service: GeminiService | None = None


def get_settings() -> Settings:
    return Settings()


def get_entry_service() -> EntryService:
    global _entry_service
    if _entry_service is None:
        _entry_service = EntryService(get_settings())
    return _entry_service


def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService(get_settings())
    return _gemini_service


def empty_entry(date_str: str) -> dict:
    return {
        "date": date_str,
        "notes": [],
        "summary": "",
        "discussion": [],
        "created_at": "",
        "updated_at": "",
    }


async def _auto_extract_keywords(
    text: str, date_str: str, service: EntryService, gemini: GeminiService
):
    """Background task: extract keywords for a newly added note."""
    try:
        raw_entry = await service.storage.get_entry(date_str)
        for note in raw_entry.get("notes", []):
            if note["text"] == text and not note.get("keywords"):
                image_paths = []
                for img_rel in note.get("images", []):
                    img_abs = service.image_service.get_abs_path(img_rel)
                    if img_abs.exists():
                        image_paths.append(str(img_abs))

                if image_paths:
                    kw = await gemini.extract_keywords_with_images(text, image_paths)
                else:
                    kw = await gemini.extract_keywords(text)
                note_keywords = {note["note_id"]: kw}
                await service.update_keywords(date_str, note_keywords)
                break
    except Exception:
        import logging
        logging.getLogger("uvicorn").warning("Auto-extract keywords failed for new note")


@router.post("/notes")
async def add_note(
    background_tasks: BackgroundTasks,
    text: str = Form(default=""),
    images: list[UploadFile] = File(default=[]),
    date: Optional[str] = Form(default=None),
    service: EntryService = Depends(get_entry_service),
    gemini: GeminiService = Depends(get_gemini_service),
):
    if not text.strip() and not any(f.filename for f in images):
        raise HTTPException(status_code=400, detail={"error": "请提供文字内容或至少一张图片", "detail": ""})

    if len([f for f in images if f.filename]) > service.settings.max_image_count:
        raise HTTPException(
            status_code=400,
            detail={"error": f"最多只能上传{service.settings.max_image_count}张图片", "detail": ""},
        )

    try:
        result = await service.add_note(text, images, date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "detail": ""})

    # Auto-extract keywords in background — don't block the response
    if text.strip():
        date_str = date or date_utils.today_str()
        background_tasks.add_task(_auto_extract_keywords, text, date_str, service, gemini)

    return result


@router.get("")
async def list_entries(service: EntryService = Depends(get_entry_service)):
    entries = await service.list_entries()
    return {"entries": entries}


@router.get("/{date}")
async def get_entry(date: str, service: EntryService = Depends(get_entry_service)):
    if not date_utils.is_valid_date(date):
        raise HTTPException(status_code=400, detail={"error": "日期格式无效", "detail": f"应为 YYYY-MM-DD，收到: {date}"})
    try:
        return await service.get_entry(date)
    except EntryNotFoundError:
        return empty_entry(date)


@router.delete("/{date}/notes/{note_id}")
async def delete_note(date: str, note_id: str, service: EntryService = Depends(get_entry_service)):
    try:
        return await service.delete_note(date, note_id)
    except EntryNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": "未找到记录", "detail": str(e)})
    except NoteNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": "未找到笔记", "detail": str(e)})


@router.post("/{date}/summarize")
async def summarize_entry(
    date: str,
    service: EntryService = Depends(get_entry_service),
    gemini: GeminiService = Depends(get_gemini_service),
):
    try:
        entry = await service.get_entry(date)
    except EntryNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": "未找到记录", "detail": str(e)})

    raw_entry = await service.storage.get_entry(date)
    context = service.build_context_for_summary(raw_entry)

    # Collect all image paths from all notes
    image_paths = []
    for note in raw_entry.get("notes", []):
        for img_rel in note.get("images", []):
            img_abs = service.image_service.get_abs_path(img_rel)
            if img_abs.exists():
                image_paths.append(str(img_abs))

    try:
        if image_paths:
            summary = await gemini.summarize_with_images(context, image_paths)
        else:
            summary = await gemini.generate_summary(context)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={"error": "AI 服务暂时不可用", "detail": str(e)},
        )

    result = await service.update_summary(date, summary)

    # If no discussion yet, generate a proactive opener from 回响AI助手
    if not entry.get("discussion"):
        try:
            opener = await gemini.generate_opener(context, summary)
            result = await service.add_opener(date, opener)
        except Exception as e:
            import logging
            logging.getLogger("uvicorn").warning(f"Opener generation failed: {e}")

    return result


@router.post("/{date}/keywords")
async def extract_keywords(
    date: str,
    service: EntryService = Depends(get_entry_service),
    gemini: GeminiService = Depends(get_gemini_service),
):
    try:
        entry = await service.get_entry(date)
    except EntryNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": "未找到记录", "detail": str(e)})

    raw_entry = await service.storage.get_entry(date)

    note_keywords: dict[str, str] = {}
    for note in raw_entry.get("notes", []):
        if note.get("text", "").strip():
            image_paths = []
            for img_rel in note.get("images", []):
                img_abs = service.image_service.get_abs_path(img_rel)
                if img_abs.exists():
                    image_paths.append(str(img_abs))

            try:
                if image_paths:
                    kw = await gemini.extract_keywords_with_images(note["text"], image_paths)
                else:
                    kw = await gemini.extract_keywords(note["text"])
                note_keywords[note["note_id"]] = kw
            except Exception as e:
                raise HTTPException(
                    status_code=502,
                    detail={"error": "AI 服务暂时不可用", "detail": str(e)},
                )

    result = await service.update_keywords(date, note_keywords)
    return result


@router.post("/{date}/notes/{note_id}/keywords")
async def extract_note_keywords(
    date: str,
    note_id: str,
    service: EntryService = Depends(get_entry_service),
    gemini: GeminiService = Depends(get_gemini_service),
):
    try:
        await service.get_entry(date)
    except EntryNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": "未找到记录", "detail": str(e)})

    raw_entry = await service.storage.get_entry(date)
    target = None
    for note in raw_entry.get("notes", []):
        if note["note_id"] == note_id:
            target = note
            break
    if not target:
        raise HTTPException(status_code=404, detail={"error": "未找到笔记", "detail": f"note_id: {note_id}"})
    if not target.get("text", "").strip():
        raise HTTPException(status_code=400, detail={"error": "笔记无文字内容", "detail": ""})

    try:
        image_paths = []
        for img_rel in target.get("images", []):
            img_abs = service.image_service.get_abs_path(img_rel)
            if img_abs.exists():
                image_paths.append(str(img_abs))

        if image_paths:
            kw = await gemini.extract_keywords_with_images(target["text"], image_paths)
        else:
            kw = await gemini.extract_keywords(target["text"])
    except Exception as e:
        raise HTTPException(status_code=502, detail={"error": "AI 服务暂时不可用", "detail": str(e)})

    result = await service.update_keywords(date, {note_id: kw})
    return result


@router.post("/{date}/discuss")
async def discuss_entry(
    date: str,
    message: dict,
    service: EntryService = Depends(get_entry_service),
    gemini: GeminiService = Depends(get_gemini_service),
):
    user_message = message.get("message", "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail={"error": "消息不能为空", "detail": ""})

    try:
        entry = await service.get_entry(date)
    except EntryNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": "未找到记录", "detail": str(e)})

    raw_entry = await service.storage.get_entry(date)
    context = service.build_context_for_discuss(raw_entry)

    # Collect image paths
    image_paths = []
    for note in raw_entry.get("notes", []):
        for img_rel in note.get("images", []):
            img_abs = service.image_service.get_abs_path(img_rel)
            if img_abs.exists():
                image_paths.append(str(img_abs))

    try:
        if image_paths:
            ai_reply = await gemini.discuss_with_images(context, user_message, image_paths)
        else:
            ai_reply = await gemini.discuss(context, user_message)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={"error": "AI 服务暂时不可用", "detail": str(e)},
        )

    result = await service.add_discussion_message(date, user_message, ai_reply)
    return result


@router.post("/{date}/reopen")
async def reopen_discussion(
    date: str,
    service: EntryService = Depends(get_entry_service),
    gemini: GeminiService = Depends(get_gemini_service),
):
    try:
        entry = await service.get_entry(date)
    except EntryNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": "未找到记录", "detail": str(e)})

    raw_entry = await service.storage.get_entry(date)
    context = service.build_context_for_summary(raw_entry)
    summary = entry.get("summary", "")

    try:
        opener = await gemini.generate_opener(context, summary)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={"error": "AI 服务暂时不可用", "detail": str(e)},
        )

    await service.clear_discussion(date)
    result = await service.add_opener(date, opener)
    return result
