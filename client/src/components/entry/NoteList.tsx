import { useState } from 'react';
import type { NoteItem } from '../../types';
import { useNoteKeywords } from '../../hooks/useNoteKeywords';
import ImageViewer from '../common/ImageViewer';

interface Props {
  date: string;
  notes: NoteItem[];
  onDelete?: (noteId: string) => void;
  readOnly?: boolean;
  onExtractKeywords?: () => void;
  keywordsLoading?: boolean;
}

export default function NoteList({ date, notes, onDelete, readOnly, onExtractKeywords, keywordsLoading }: Props) {
  const [loadingNoteId, setLoadingNoteId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [viewerImages, setViewerImages] = useState<{ images: string[]; index: number } | null>(null);
  const noteKeywords = useNoteKeywords();

  if (notes.length === 0) return null;

  const toggleCollapse = (noteId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const collapseAll = () => {
    if (collapsedIds.size === notes.length) {
      setCollapsedIds(new Set());
    } else {
      setCollapsedIds(new Set(notes.map((n) => n.note_id)));
    }
  };

  const allCollapsed = collapsedIds.size === notes.length;

  const handleRefreshNote = (noteId: string) => {
    setLoadingNoteId(noteId);
    noteKeywords.mutate(
      { date, noteId },
      { onSettled: () => setLoadingNoteId(null) }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">今日笔记</span>
        <button
          onClick={collapseAll}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {allCollapsed ? '全部展开' : '全部折叠'}
        </button>
        {onExtractKeywords && (
          <button
            onClick={onExtractKeywords}
            disabled={keywordsLoading}
            className="ml-auto text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full hover:bg-slate-200 disabled:opacity-50 transition-colors"
          >
            {keywordsLoading ? '提取中...' : '全部重新提取'}
          </button>
        )}
      </div>

      <div className="relative pl-6">
        {/* timeline line */}
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200 rounded-full" />

        <div className="space-y-4">
          {notes.map((note, _i) => {
            const isThisLoading = loadingNoteId === note.note_id;
            const isCollapsed = collapsedIds.has(note.note_id);
            return (
              <div key={note.note_id} className="relative animate-fade-in">
                {/* timeline dot */}
                <div
                  className={`absolute left-[-1.15rem] top-2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm transition-colors ${isCollapsed ? 'bg-slate-300' : 'bg-slate-400'}`}
                />

                {/* time label + collapse toggle */}
                <button
                  onClick={() => toggleCollapse(note.note_id)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1.5 hover:text-slate-600 transition-colors"
                >
                  <svg className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {note.time}
                </button>

                {/* content card */}
                <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 transition-all overflow-hidden ${isCollapsed ? 'p-3' : 'p-4'}`}>
                  {/* keyword row — always visible */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {note.keywords && note.keywords.split(/[、,，]/).filter(Boolean).map((kw, idx) => (
                        <span key={idx} className="inline-block px-2.5 py-0.5 rounded-full bg-lime-50 text-lime-600 text-xs font-medium">
                          {kw.trim()}
                        </span>
                      ))}
                      {!isCollapsed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRefreshNote(note.note_id); }}
                          disabled={isThisLoading}
                          className="flex-shrink-0 text-slate-300 hover:text-slate-500 disabled:opacity-50 transition-colors p-0.5"
                          title="重新提取关键词"
                        >
                          <svg className={`w-3.5 h-3.5 ${isThisLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!readOnly && onDelete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(note.note_id); }}
                          className="text-slate-300 hover:text-rose-400 transition-colors p-0.5 shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* expandable content */}
                  {!isCollapsed && (
                    <>
                      {note.images.length > 0 && (
                        <div className="flex gap-2 flex-wrap mt-3">
                          {note.images.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setViewerImages({ images: note.images, index: idx })}
                              className="cursor-zoom-in"
                            >
                              <img
                                src={img}
                                alt=""
                                className="w-20 h-20 rounded-lg object-cover shadow-sm"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                      {note.text && (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mt-3">{note.text}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewerImages && (
        <ImageViewer
          images={viewerImages.images}
          initialIndex={viewerImages.index}
          onClose={() => setViewerImages(null)}
        />
      )}
    </div>
  );
}
