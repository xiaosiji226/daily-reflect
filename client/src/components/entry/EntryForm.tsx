import { useState } from 'react';
import TextInput from './TextInput';
import ImageUploader from './ImageUploader';

interface Props {
  onSubmit: (text: string, images: File[]) => void;
  loading?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export default function EntryForm({ onSubmit, loading, expanded = true, onToggle }: Props) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = () => {
    if (!text.trim() && images.length === 0) return;
    onSubmit(text, images);
    setText('');
    setImages([]);
  };

  const canSubmit = (text.trim() || images.length > 0) && !loading;

  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full py-3 rounded-full bg-primary-500 text-white font-medium text-sm active:bg-primary-600 transition-colors shadow-lg shadow-primary-200"
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          记录新想法
        </span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3 animate-fade-in">
      <TextInput value={text} onChange={setText} />
      <ImageUploader images={images} onChange={setImages} />
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
          canSubmit
            ? 'bg-primary-500 text-white active:bg-primary-600 shadow-sm shadow-primary-200 hover:shadow-md hover:shadow-primary-200'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            提交中...
          </span>
        ) : (
          '提交笔记'
        )}
      </button>
    </div>
  );
}
