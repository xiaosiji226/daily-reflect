import type { NoteItem } from '../../types';

interface Props {
  notes: NoteItem[];
}

export default function KeywordBar({ notes }: Props) {
  const allKeywords: string[] = [];
  for (const note of notes) {
    if (note.keywords) {
      for (const kw of note.keywords.split(/[、,，]/)) {
        const trimmed = kw.trim();
        if (trimmed && !allKeywords.includes(trimmed)) {
          allKeywords.push(trimmed);
        }
      }
    }
  }

  if (allKeywords.length === 0) return null;

  return (
    <div className="flex items-start gap-2.5 px-1 animate-slide-up">
      <span className="text-xs text-slate-400 font-medium pt-0.5 whitespace-nowrap">关键词</span>
      <div className="flex flex-wrap gap-1.5">
        {allKeywords.map((kw) => (
          <span
            key={kw}
            className="inline-block px-2.5 py-0.5 rounded-full bg-white/80 text-slate-600 text-xs font-medium border border-slate-200/80 shadow-sm"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}
