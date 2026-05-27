import { useNavigate } from 'react-router-dom';
import type { DaySummary } from '../../types';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${parseInt(m)}月${parseInt(d)}日 ${weekdays[date.getDay()]}`;
}

interface Props {
  entry: DaySummary;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (date: string) => void;
}

export default function EntryListItem({ entry, selectable, selected, onToggle }: Props) {
  const navigate = useNavigate();
  const keywords = (entry.keywords ?? []).slice(0, 3);

  const handleClick = () => {
    if (selectable) {
      onToggle?.(entry.date);
    } else {
      navigate(`/entry/${entry.date}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full bg-white rounded-2xl shadow-sm border p-4 text-left transition-all hover:shadow-md animate-fade-in flex items-start gap-3 ${
        selectable && selected ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-100'
      }`}
    >
      {selectable && (
        <span
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm font-semibold text-slate-700 shrink-0">{formatDate(entry.date)}</span>
            {keywords.length > 0 && keywords.map((kw) => (
              <span key={kw} className="text-xs text-lime-600 bg-lime-50 px-2 py-0.5 rounded-full whitespace-nowrap">{kw}</span>
            ))}
          </div>
          <span className="text-xs text-slate-400 shrink-0 ml-2">{entry.note_count} 条笔记</span>
        </div>
        {entry.summary_preview ? (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{entry.summary_preview}</p>
        ) : (
          <p className="text-xs text-slate-300 italic">暂无总结</p>
        )}
      </span>
    </button>
  );
}
