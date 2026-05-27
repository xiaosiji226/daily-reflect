export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 gradient-header safe-top">
      <div className="flex items-center justify-center h-14 px-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20h9m-9 0a9 9 0 11-6.365-15.365M12 20a9 9 0 006.365-15.365M12 20V4" />
          </svg>
          <h1 className="text-base font-semibold tracking-wide text-slate-700">回响</h1>
        </div>
      </div>
    </header>
  );
}
