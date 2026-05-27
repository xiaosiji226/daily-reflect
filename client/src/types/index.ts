export interface NoteItem {
  note_id: string;
  time: string;
  text: string;
  images: string[];
  keywords?: string;
}

export interface DiscussionMessage {
  role: 'user' | 'ai';
  time: string;
  content: string;
}

export interface EntryDetail {
  date: string;
  notes: NoteItem[];
  summary: string;
  discussion: DiscussionMessage[];
  created_at: string;
  updated_at: string;
}

export interface DaySummary {
  date: string;
  note_count: number;
  summary_preview: string;
  keywords: string[];
  created_at: string;
}

export interface EntryListResponse {
  entries: DaySummary[];
}

export interface ErrorResponse {
  error: string;
  detail: string;
}

export interface ExportResponse {
  exported: number;
  target: string;
  errors: string[];
}

export interface ExportConfig {
  obsidian_vault_path: string | null;
}
