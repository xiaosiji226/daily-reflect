interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = '出了点问题', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <span className="text-sm text-slate-500">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary-500 font-medium mt-1 px-4 py-1.5 rounded-full border border-primary-200 active:bg-primary-50"
        >
          重试
        </button>
      )}
    </div>
  );
}
