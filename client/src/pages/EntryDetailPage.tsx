import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NoteList from '../components/entry/NoteList';
import KeywordBar from '../components/reflection/KeywordBar';
import UnifiedAIPanel from '../components/reflection/UnifiedAIPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { useEntry } from '../hooks/useEntry';
import { useSummarize } from '../hooks/useSummarize';
import { useDiscuss } from '../hooks/useDiscuss';
import { useReopen } from '../hooks/useReopen';
import { useKeywords } from '../hooks/useKeywords';

export default function EntryDetailPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('main')?.scrollTo(0, 0);
  }, []);
  const { data: entry, isLoading, error, refetch } = useEntry(date ?? null);
  const summarize = useSummarize();
  const discuss = useDiscuss();
  const reopen = useReopen();
  const keywords = useKeywords();

  if (isLoading) return <LoadingSpinner />;
  if (error || !entry) {
    return (
      <div className="pt-12">
        <ErrorMessage
          message={error?.message ?? '未找到记录'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const handleSummarize = () => {
    if (date) summarize.mutate(date);
  };

  const handleDiscuss = (message: string) => {
    if (date) discuss.mutate({ date, message });
  };

  const handleReopen = () => {
    if (date) reopen.mutate(date);
  };

  const handleKeywords = () => {
    if (date) keywords.mutate(date);
  };

  return (
    <div className="p-4 space-y-5">
      {/* Back nav */}
      <div className="flex items-center gap-3 px-1">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-primary-500 font-medium active:text-primary-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="text-sm font-semibold text-slate-500">{entry.date}</span>
      </div>

      <KeywordBar notes={entry.notes} />

      <NoteList date={entry.date} notes={entry.notes} readOnly onExtractKeywords={handleKeywords} keywordsLoading={keywords.isPending} />

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
    </div>
  );
}
