import { useState, useEffect } from 'react';
import HistoryList from '../components/history/HistoryList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import { useEntries } from '../hooks/useEntries';
import { exportEntries, fetchExportConfig, browseExportFolder } from '../services/api';
import strings from '../strings';

export default function HistoryPage() {
  const { data, isLoading, error, refetch } = useEntries();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ exported: number; errors: string[] } | null>(null);
  const [showPathDialog, setShowPathDialog] = useState(false);
  const [targetPath, setTargetPath] = useState('');

  useEffect(() => {
    if (!exportResult) return;
    const timer = setTimeout(() => setExportResult(null), 5000);
    return () => clearTimeout(timer);
  }, [exportResult]);

  const handleBrowseFolder = async () => {
    try {
      const result = await browseExportFolder();
      setTargetPath(result.path);
    } catch {
      // 用户取消选择或系统不支持 tkinter，静默忽略
    }
  };

  const toggleDate = (date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleEnterSelectMode = async () => {
    setSelectMode(true);
    setExportResult(null);
    try {
      const config = await fetchExportConfig();
      setTargetPath(config.obsidian_vault_path || '');
    } catch {
      setTargetPath('');
    }
  };

  const handleCancelSelect = () => {
    setSelectMode(false);
    setSelectedDates(new Set());
    setExportResult(null);
  };

  const handleExportClick = () => {
    if (selectedDates.size === 0) return;
    setShowPathDialog(true);
  };

  const handleConfirmExport = async () => {
    setShowPathDialog(false);
    setExporting(true);
    setExportResult(null);
    try {
      const result = await exportEntries(
        Array.from(selectedDates),
        targetPath.trim() || undefined
      );
      setExportResult({ exported: result.exported, errors: result.errors });
      setSelectMode(false);
      setSelectedDates(new Set());
    } catch (e) {
      setExportResult({ exported: 0, errors: [e instanceof Error ? e.message : '导出失败'] });
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} onRetry={() => refetch()} />;

  const entries = data?.entries ?? [];

  if (entries.length === 0) {
    return <EmptyState title="还没有记录" subtitle="写下今天的第一条想法吧" />;
  }

  return (
    <div className="relative min-h-full pb-24">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500">历史记录</h2>
        {!selectMode ? (
          <button
            onClick={handleEnterSelectMode}
            className="text-xs text-indigo-500 font-medium active:text-indigo-600"
          >
            {strings.selectExport}
          </button>
        ) : (
          <button
            onClick={handleCancelSelect}
            className="text-xs text-slate-400 font-medium active:text-slate-500"
          >
            {strings.cancelSelect}
          </button>
        )}
      </div>

      <HistoryList
        entries={entries}
        selectable={selectMode}
        selectedDates={selectedDates}
        onToggleDate={toggleDate}
      />

      {exportResult && (
        <div className="mx-4 mb-4">
          {exportResult.errors.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm font-medium text-amber-800">
                {exportResult.exported > 0
                  ? strings.exportPartial
                      .replace('{exported}', String(exportResult.exported))
                      .replace('{failed}', String(exportResult.errors.length))
                  : strings.exportFail}
              </p>
              <ul className="mt-1 text-xs text-amber-600 space-y-0.5">
                {exportResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          ) : exportResult.exported > 0 ? (
            <div className="bg-lime-50 border border-lime-200 rounded-xl p-3">
              <p className="text-sm font-medium text-lime-700">
                {strings.exportSuccess.replace('{count}', String(exportResult.exported))}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {selectMode && selectedDates.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 z-40">
          <button
            onClick={handleExportClick}
            disabled={exporting}
            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm active:bg-indigo-600 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            {exporting ? (
              strings.exporting
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {strings.exportToObsidian} ({selectedDates.size}篇)
              </>
            )}
          </button>
        </div>
      )}

      {showPathDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowPathDialog(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md px-6 pt-6 pb-8 shadow-xl">
            <h3 className="text-base font-semibold text-slate-800 mb-4">
              {strings.exportPathTitle}
            </h3>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              {strings.exportPathLabel}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder={strings.exportPathPlaceholder}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                autoFocus
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-500 active:bg-slate-50 whitespace-nowrap"
              >
                {strings.browse}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">{strings.exportPathHint}</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowPathDialog(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-500 active:bg-slate-50"
              >
                {strings.cancel}
              </button>
              <button
                onClick={handleConfirmExport}
                className="flex-1 py-2.5 rounded-lg bg-indigo-500 text-sm font-semibold text-white active:bg-indigo-600"
              >
                {strings.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
