from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class NoteAddRequest(BaseModel):
    text: str = Field(default="", max_length=10000)
    date: Optional[str] = None  # YYYY-MM-DD, defaults to today


class SummarizeRequest(BaseModel):
    pass


class DiscussRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class NoteItem(BaseModel):
    note_id: str
    time: str  # HH:MM
    text: str
    images: list[str] = []  # URL paths
    keywords: str = ""


class DiscussionMessage(BaseModel):
    role: str  # "user" or "ai"
    time: str
    content: str


class EntryDetail(BaseModel):
    date: str
    notes: list[NoteItem]
    summary: str = ""
    discussion: list[DiscussionMessage] = []
    created_at: str
    updated_at: str


class DaySummary(BaseModel):
    date: str
    note_count: int
    summary_preview: str  # first 100 chars of summary
    keywords: list[str] = []
    created_at: str


class EntryListResponse(BaseModel):
    entries: list[DaySummary]


class ErrorResponse(BaseModel):
    error: str
    detail: str = ""
