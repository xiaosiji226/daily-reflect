# Daily Reflect

Daily reflection journal app. Backend: FastAPI + Markdown storage + Gemini AI. Frontend: React + TypeScript + Vite + TanStack Query.

## Project structure

```
server/                         # FastAPI backend
  app/
    __init__.py                 # (empty)
    config.py                   # Settings via pydantic-settings (.env)
    models/schemas.py           # Pydantic models: NoteAddRequest, EntryDetail, etc.
    storage/
      base.py                   # StorageBackend ABC
      markdown_storage.py       # Markdown file-based implementation
    utils/
      markdown_io.py            # Parse/write markdown with YAML frontmatter
      date_utils.py             # CST timezone helpers, today_str(), etc.
    services/
      image_service.py          # Image upload, validation, EXIF strip, HEIC→JPG, resize
      entry_service.py          # Business logic: CRUD, summary, discussion
      gemini_service.py         # Gemini AI: summarize, discuss, transcribe, punctuate
    api/
      images.py                 # GET /api/images/{year}/{month}/{filename}
      entries.py                # CRUD /api/entries, summarize, discuss
      voice.py                  # POST /api/voice/transcribe, /api/voice/punctuate
client/                         # React frontend
  src/
    App.tsx                     # Router: /, /history, /entry/:date
    pages/
      HomePage.tsx              # Today's notes + summary + discussion
      HistoryPage.tsx           # Past entries list
      EntryDetailPage.tsx       # View/edit a past day
    components/
      entry/                    # EntryForm, NoteList, TextInput, ImageUploader, ImagePreview
      reflection/               # SummarySection, DiscussionSection
      history/                  # HistoryList, EntryListItem
      layout/                   # AppShell, Header, BottomNav
      common/                   # LoadingSpinner, ErrorMessage, EmptyState, ConfirmDialog
    services/api.ts             # HTTP client, all API calls
    hooks/                      # useEntry, useEntries, useSubmitNote, useSummarize, useDiscuss, useDeleteNote, useVoiceInput
    types/index.ts              # TypeScript types
    strings.ts                  # Chinese UI strings
```

## Key conventions

- Dates use `YYYY-MM-DD` format, times use `HH:MM` (24h), timezone is CST (+08:00)
- Markdown files stored in `data/entries/{year}/{month}/{date}.md` with YAML frontmatter
- Images stored in `data/images/{year}/{month}/{note_id}-{seq}.jpg`
- Note IDs are auto-generated: `n1`, `n2`, ...
- Gemini API key in `.env` as `GEMINI_API_KEY`
- Frontend runs on :5173, backend on :8000

## Running the app

- Backend: `cd server && uvicorn app.main:app --reload`
- Frontend: `cd client && npm run dev`

---

## Gemini service (gemini_service.py)

Model: `gemini-2.5-flash`. All methods are `async`. Prompts are module-level constants.

| Method | Signature | Returns | What it does |
|---|---|---|---|
| `generate_summary` | `(notes_context: str) -> str` | summary text | Summarize today's notes in 2-3 sentences, ≤150 chars |
| `generate_opener` | `(notes_context: str, summary: str) -> str` | opener text | Proactive 回响AI助手 opener to start a discussion |
| `discuss` | `(full_context: str, user_message: str) -> str` | AI reply | Discussion reply, with follow-up question |
| `summarize_with_images` | `(notes_context: str, image_paths: list[str]) -> str` | summary text | Summary including image content (handwritten notes) |
| `transcribe_audio` | `(audio_bytes: bytes, mime_type: str) -> str` | transcribed text | Speech-to-text with punctuation |
| `add_punctuation` | `(text: str) -> str` | punctuated text | Add punctuation to Chinese text |
| `discuss_with_images` | `(full_context, user_message, image_paths) -> str` | AI reply | Discussion with image context |
| `extract_keywords` | `(notes_context: str) -> str` | 顿号-separated keywords | Extract 1-3 core keywords per note |

### Prompt constants

All prompts are in Chinese, stored as module-level constants: `SUMMARIZE_PROMPT`, `DISCUSS_PROMPT`, `OPENER_PROMPT`, `KEYWORD_PROMPT`.

---

## Backend patterns

### Adding a new Gemini-powered feature (recipe)

Follow the existing summarize flow as a template:

**1. `gemini_service.py`** — Add a method that calls Gemini:
```python
async def my_new_method(self, input: str) -> str:
    response = self.client.models.generate_content(
        model=self.model,
        contents=MY_PROMPT + "\n" + input,
        config=types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=2048,
        ),
    )
    return response.text.strip()
```

**2. `entry_service.py`** — If result needs persistence (stored in markdown frontmatter/metadata), add a service method. If it's purely computed on-the-fly, skip this step.

**3. `models/schemas.py`** — Add request/response Pydantic models if needed.

**4. `api/entries.py`** — Add a route. Singleton pattern for services:
- Module-level `_gemini_service: GeminiService | None = None`
- `get_gemini_service()` factory with lazy init
- Inject via `Depends(get_gemini_service)`
- Gemini failures return HTTP 502 with `{"error": "AI 服务暂时不可用", "detail": str(e)}`

**5. `main.py`** — If creating a new API file, `include_router` it.

### API error response format

```json
{"error": "用户可读的错误标题", "detail": "技术细节（可为空字符串）"}
```

### Service singleton pattern

Each API module has its own module-level `_gemini_service` and `get_gemini_service()` — they are NOT shared across modules (see `entries.py` and `voice.py` both defining their own).

---

## Frontend patterns

### Adding a new API call + hook + UI (recipe)

**1. `types/index.ts`** — Add TypeScript interfaces for request/response, and extend `EntryDetail` if the new field is returned as part of entry data.

**2. `services/api.ts`** — Add a typed fetch function following the existing pattern:
- `handleResponse<T>(res)` for JSON responses
- `cacheBust()` for GET requests
- FormData for file uploads, JSON for everything else

**3. `hooks/`** — Create a new hook using `useMutation` + `useQueryClient`:
- `onSuccess`: invalidate `['entry', date]` to refresh data
- For optimistic updates, follow `useDiscuss.ts` pattern with `onMutate` / `onError` rollback

**4. Component** — Import the hook, call `mutate` / `mutateAsync`, use `isPending` for loading state.

### Query key convention

Entry data is cached under `['entry', date]`. Any mutation that changes entry data must invalidate this key.

### API base path

All API calls go to `/api/...` (Vite proxy handles forwarding to :8000).

---

## Current status

Backend and frontend are both functional. All API routes (entries CRUD, summarize, discuss, voice) are implemented. Frontend pages (Home, History, EntryDetail) are complete with hooks, API client, voice input, and PWA support.

### Unimplemented / known gaps

