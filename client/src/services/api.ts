import type { EntryDetail, EntryListResponse, ExportResponse, ExportConfig, ErrorResponse } from '../types';

const BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const json: any = await res.json().catch(() => ({}));
    // FastAPI HTTPException nests error info under `detail`
    const detail = json.detail;
    if (detail && typeof detail === 'object' && detail.error) {
      throw new Error(detail.error);
    }
    if (typeof detail === 'string') {
      throw new Error(detail);
    }
    throw new Error(json.error || `请求失败 (HTTP ${res.status})`);
  }
  return res.json();
}

function cacheBust(): string {
  return `_t=${Date.now()}`;
}

export async function fetchEntries(): Promise<EntryListResponse> {
  const res = await fetch(`${BASE}/entries?${cacheBust()}`, { cache: 'no-store' });
  return handleResponse<EntryListResponse>(res);
}

export async function fetchEntry(date: string): Promise<EntryDetail> {
  const res = await fetch(`${BASE}/entries/${date}?${cacheBust()}`, { cache: 'no-store' });
  return handleResponse<EntryDetail>(res);
}

export async function addNote(
  text: string,
  images: File[],
  date?: string
): Promise<EntryDetail> {
  const form = new FormData();
  form.append('text', text);
  images.forEach((f) => form.append('images', f));
  if (date) form.append('date', date);

  const res = await fetch(`${BASE}/entries/notes`, {
    method: 'POST',
    body: form,
  });
  return handleResponse<EntryDetail>(res);
}

export async function deleteNote(date: string, noteId: string): Promise<EntryDetail> {
  const res = await fetch(`${BASE}/entries/${date}/notes/${noteId}`, {
    method: 'DELETE',
  });
  return handleResponse<EntryDetail>(res);
}

export async function summarizeDay(date: string): Promise<EntryDetail> {
  const res = await fetch(`${BASE}/entries/${date}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return handleResponse<EntryDetail>(res);
}

export async function discussMessage(date: string, message: string): Promise<EntryDetail> {
  const res = await fetch(`${BASE}/entries/${date}/discuss`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return handleResponse<EntryDetail>(res);
}

export async function extractKeywords(date: string): Promise<EntryDetail> {
  const res = await fetch(`${BASE}/entries/${date}/keywords`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return handleResponse<EntryDetail>(res);
}

export async function extractNoteKeywords(date: string, noteId: string): Promise<EntryDetail> {
  const res = await fetch(`${BASE}/entries/${date}/notes/${noteId}/keywords`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return handleResponse<EntryDetail>(res);
}

export function imageUrl(path: string): string {
  return path;
}

export async function reopenDiscussion(date: string): Promise<EntryDetail> {
  const res = await fetch(`${BASE}/entries/${date}/reopen`, { method: 'POST' });
  return handleResponse<EntryDetail>(res);
}

export async function exportEntries(dates: string[], targetPath?: string): Promise<ExportResponse> {
  const res = await fetch(`${BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dates, target_path: targetPath }),
  });
  return handleResponse<ExportResponse>(res);
}

export async function fetchExportConfig(): Promise<ExportConfig> {
  const res = await fetch(`${BASE}/export/config`, { cache: 'no-store' });
  return handleResponse<ExportConfig>(res);
}

export async function browseExportFolder(): Promise<{ path: string }> {
  const res = await fetch(`${BASE}/export/browse-folder`, { method: 'POST' });
  return handleResponse<{ path: string }>(res);
}
