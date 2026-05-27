import { useState, useRef, useEffect } from 'react';
import type { DiscussionMessage } from '../../types';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface Props {
  summary: string;
  onGenerate: () => void;
  summarizeLoading?: boolean;
  messages: DiscussionMessage[];
  onSend: (message: string) => void;
  discussLoading?: boolean;
  onReopen?: () => void;
  reopenLoading?: boolean;
}

type Tab = 'summary' | 'discuss';

export default function UnifiedAIPanel({
  summary,
  onGenerate,
  summarizeLoading,
  messages,
  onSend,
  discussLoading,
  onReopen,
  reopenLoading,
}: Props) {
  const [tab, setTab] = useState<Tab>(() => summary ? 'summary' : 'discuss');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || discussLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const { isListening, supported, start, stop } = useVoiceInput(input, setInput);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setTab('summary')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
            tab === 'summary'
              ? 'text-violet-600 border-b-2 border-violet-500 bg-violet-50/50'
              : 'text-slate-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          今日总结
        </button>
        <button
          onClick={() => setTab('discuss')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
            tab === 'discuss'
              ? 'text-violet-600 border-b-2 border-violet-500 bg-violet-50/50'
              : 'text-slate-400'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          对话
        </button>
      </div>

      {/* Tab content */}
      {tab === 'summary' ? (
        <div className="p-4">
          {!summary ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400 mb-4">让回响帮你回顾今天的笔记</p>
              <button
                onClick={onGenerate}
                disabled={summarizeLoading}
                className="w-full py-2.5 rounded-xl bg-violet-500 text-white font-medium text-sm active:bg-violet-600 disabled:opacity-50 transition-colors"
              >
                {summarizeLoading ? '回响正在思考...' : '生成今日总结'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={onGenerate}
                  disabled={summarizeLoading}
                  className="text-xs text-violet-500 font-medium active:text-violet-600 disabled:opacity-50 transition-colors"
                >
                  {summarizeLoading ? '生成中...' : '重新生成'}
                </button>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4">
          {messages.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl">
              生成总结后，回响会主动和你聊聊今天
            </p>
          )}

          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0 mr-2 mt-1">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-teal-500 text-white rounded-br-lg'
                      : 'bg-slate-50 text-slate-700 rounded-bl-lg border border-slate-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {discussLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0 mr-2 mt-1">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="bg-slate-50 rounded-2xl rounded-bl-lg border border-slate-100 px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-300 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-teal-300 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 rounded-full bg-teal-300 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Chat input */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="和回响聊聊今天的想法..."
                rows={1}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-slate-50 resize-none"
                style={{ maxHeight: '120px' }}
              />
              {supported && (
                <button
                  type="button"
                  onClick={isListening ? stop : start}
                  className={`absolute right-2 bottom-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200'
                      : 'text-slate-400 hover:text-teal-500 active:bg-teal-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || discussLoading}
              className="shrink-0 px-4 h-[42px] rounded-xl bg-teal-500 text-white text-sm font-medium active:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-teal-200"
            >
              发送
            </button>
          </div>

          {/* Reopen button */}
          {onReopen && (
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={onReopen}
                disabled={reopenLoading}
                className="text-xs text-teal-500 font-medium active:text-teal-600 disabled:opacity-50 transition-colors"
              >
                {reopenLoading ? '生成中...' : '重新生成对话'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
