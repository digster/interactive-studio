import { RotateCw, Eye } from 'lucide-react';
import { useExecutionStore } from '../../store/executionStore';

export default function PreviewPane() {
  const previewType = useExecutionStore((s) => s.previewType);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Header Bar */}
      <div className="h-9 flex items-center justify-between px-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-[var(--text-muted)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)]">Preview</span>
          {previewType !== 'none' && (
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">
              {previewType}
            </span>
          )}
        </div>
        <button
          className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
          aria-label="Refresh preview"
        >
          <RotateCw size={14} />
        </button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <p className="text-sm text-[var(--text-muted)] select-none">
          Preview will appear here
        </p>
      </div>
    </div>
  );
}
