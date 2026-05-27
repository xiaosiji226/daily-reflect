interface Props {
  summary: string;
  onGenerate: () => void;
  loading?: boolean;
}

export default function SummarySection({ summary, onGenerate, loading }: Props) {
  if (!summary) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">AI 今日总结</h3>
        <p className="text-xs text-slate-400 mb-4">让回响帮你回顾今天的笔记</p>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-violet-500 text-white font-medium text-sm active:bg-violet-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '回响正在思考...' : '生成今日总结'}
        </button>
      </div>
    );
  }

  return (
    <div className="gradient-summary rounded-2xl shadow-sm border border-violet-100 p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-semibold text-violet-700">AI 总结</span>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="text-xs text-violet-500 font-medium active:text-violet-600 disabled:opacity-50 hover:underline"
        >
          {loading ? '生成中...' : '重新生成'}
        </button>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
    </div>
  );
}
