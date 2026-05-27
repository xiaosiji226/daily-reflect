import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EntryForm from '../components/entry/EntryForm';
import NoteList from '../components/entry/NoteList';
import KeywordBar from '../components/reflection/KeywordBar';
import UnifiedAIPanel from '../components/reflection/UnifiedAIPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useEntry } from '../hooks/useEntry';
import { useSubmitNote } from '../hooks/useSubmitNote';
import { useSummarize } from '../hooks/useSummarize';
import { useKeywords } from '../hooks/useKeywords';
import { useDiscuss } from '../hooks/useDiscuss';
import { useReopen } from '../hooks/useReopen';
import { useDeleteNote } from '../hooks/useDeleteNote';
import { useQueryClient } from '@tanstack/react-query';

function todayStr(): string {
  return dateStr(new Date());
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return dateStr(d);
}

function formatDateCN(date: string): string {
  const [, m, d] = date.split('-');
  return `${parseInt(m)}月${parseInt(d)}日`;
}

export default function HomePage() {
  const [displayDate, setDisplayDate] = useState(() => todayStr());
  const actualToday = todayStr();
  const isStale = displayDate !== actualToday;

  const { data: entry, isLoading, error, refetch } = useEntry(displayDate);
  const yesterdayDate = yesterdayStr(displayDate);
  const { data: yesterdayEntry, isLoading: yesterdayLoading } = useEntry(yesterdayDate);

  const navigate = useNavigate();
  const submitNote = useSubmitNote();
  const summarize = useSummarize();
  const keywords = useKeywords();
  const discuss = useDiscuss();
  const reopen = useReopen();
  const deleteNote = useDeleteNote();
  const queryClient = useQueryClient();

  const [formExpanded, setFormExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const hasNotes = entry && entry.notes.length > 0;

  const handleSubmit = (text: string, images: File[]) => {
    submitNote.mutate({ text, images, date: displayDate }, {
      onSuccess: () => setFormExpanded(false),
    });
  };

  const handleSummarize = () => {
    summarize.mutate(displayDate);
  };

  const handleKeywords = () => {
    keywords.mutate(displayDate);
  };

  const handleDiscuss = (message: string) => {
    discuss.mutate({ date: displayDate, message });
  };

  const handleReopen = () => {
    reopen.mutate(displayDate);
  };

  const handleDelete = (noteId: string) => {
    setDeleteTarget(noteId);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteNote.mutate({ date: displayDate, noteId: deleteTarget }, {
        onSuccess: () => {
          setDeleteTarget(null);
          if (entry && entry.notes.length <= 1) {
            queryClient.removeQueries({ queryKey: ['entry', displayDate] });
            queryClient.invalidateQueries({ queryKey: ['entries'] });
          }
        },
      });
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  const yesterdayKeywords: string[] = [];
  if (yesterdayEntry) {
    for (const note of yesterdayEntry.notes) {
      if (note.keywords) {
        for (const kw of note.keywords.split(/[、，]/)) {
          const trimmed = kw.trim();
          if (trimmed && !yesterdayKeywords.includes(trimmed)) {
            yesterdayKeywords.push(trimmed);
          }
        }
      }
    }
  }

  return (
    <>
      <div className={`p-4 space-y-5 ${hasNotes ? 'pb-28' : ''}`}>
        {/* Date bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
            <span className="text-sm font-semibold text-slate-600">
              {formatDateCN(displayDate)}
            </span>
          </div>
          {isStale && (
            <button
              onClick={() => setDisplayDate(actualToday)}
              className="flex items-center gap-1 text-xs text-primary-500 font-medium bg-primary-50 px-3 py-1.5 rounded-full active:bg-primary-100 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              回到今天
            </button>
          )}
        </div>

        {/* Keywords */}
        {hasNotes && <KeywordBar notes={entry.notes} />}

        {/* Yesterday recap */}
        <div
          className={`card gradient-yesterday border-amber-100 p-4 animate-slide-up ${
            yesterdayEntry && yesterdayEntry.notes.length > 0
              ? 'cursor-pointer active:bg-amber-50 transition-colors'
              : ''
          }`}
          onClick={() => {
            if (yesterdayEntry && yesterdayEntry.notes.length > 0) {
              navigate(`/entry/${yesterdayDate}`);
            }
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-amber-700 shrink-0">昨日回顾</span>
              {yesterdayKeywords.slice(0, 3).map((kw) => (
                <span key={kw} className="text-xs text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  {kw}
                </span>
              ))}
            </div>
            {yesterdayEntry && yesterdayEntry.notes.length > 0 && (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
          {yesterdayLoading ? (
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          ) : yesterdayEntry && yesterdayEntry.notes.length > 0 ? (
            <>
              <p className="text-xs text-amber-600/70 mb-1.5">
                {formatDateCN(yesterdayDate)} · {yesterdayEntry.notes.length} 条笔记
              </p>
              {yesterdayEntry.summary ? (
                <p className="text-sm text-slate-700 leading-relaxed max-h-24 overflow-y-auto">{yesterdayEntry.summary}</p>
              ) : (
                <p className="text-sm text-amber-500/60 italic">还没有总结</p>
              )}
            </>
          ) : (
            <p className="text-sm text-amber-400/70 italic">昨天没有记录</p>
          )}
        </div>

        {/* Notes section */}
        {hasNotes && (
          <NoteList
            date={displayDate}
            notes={entry.notes}
            onDelete={handleDelete}
            onExtractKeywords={handleKeywords}
            keywordsLoading={keywords.isPending}
          />
        )}

        {/* Inline entry form — only when no notes yet (first-time experience) */}
        {!hasNotes && (
          <EntryForm
            onSubmit={handleSubmit}
            loading={submitNote.isPending}
            expanded={true}
          />
        )}

        {/* AI unified panel */}
        {hasNotes && (
          <UnifiedAIPanel
            summary={entry.summary}
            onGenerate={handleSummarize}
            summarizeLoading={summarize.isPending}
            messages={entry.discussion}
            onSend={handleDiscuss}
            discussLoading={discuss.isPending}
            onReopen={handleReopen}
            reopenLoading={reopen.isPending}
          />
        )}

        {/* Delete confirmation */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="删除笔记"
          message="确定要删除这条笔记吗？删除后不可恢复。"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteNote.isPending}
        />
      </div>

      {/* Fixed bottom capture button — only when there are notes */}
      {hasNotes && (
        <>
          {formExpanded && (
            <div
              className="fixed inset-0 bg-black/20 z-30 animate-fade-in"
              onClick={() => setFormExpanded(false)}
            />
          )}
          <div className="fixed bottom-14 left-0 right-0 z-30 p-3">
            <div className="max-h-[60vh] overflow-y-auto rounded-2xl shadow-lg shadow-slate-900/10">
              <EntryForm
                onSubmit={handleSubmit}
                loading={submitNote.isPending}
                expanded={formExpanded}
                onToggle={() => setFormExpanded(true)}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
