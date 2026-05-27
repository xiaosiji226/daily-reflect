import { useRef, useEffect } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TextInput({ value, onChange, placeholder = '记录你此刻的想法...' }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const { isListening, supported, start, stop } = useVoiceInput(value, onChange);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent focus:bg-white transition-colors"
        style={{ maxHeight: '200px' }}
      />
      {supported && (
        <button
          type="button"
          onClick={isListening ? stop : start}
          className={`absolute right-2 bottom-2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200'
              : 'text-slate-400 hover:text-primary-500 active:bg-primary-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
    </div>
  );
}
