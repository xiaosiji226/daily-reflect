interface Props {
  text?: string;
}

export default function LoadingSpinner({ text = '加载中...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-3 border-slate-100" />
        <div className="absolute inset-0 w-10 h-10 rounded-full border-3 border-transparent border-t-primary-500 animate-spin" />
      </div>
      <span className="text-sm text-slate-400">{text}</span>
    </div>
  );
}
