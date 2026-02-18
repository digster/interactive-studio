import { RotateCw, Eye } from 'lucide-react';
import { useExecutionStore } from '../../store/executionStore';

export default function PreviewPane() {
  const previewContent = useExecutionStore((s) => s.previewContent);
  const previewType = useExecutionStore((s) => s.previewType);
  const requestRefresh = useExecutionStore((s) => s.requestRefresh);

  const hasContent = previewType !== 'none' && previewContent.length > 0;

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
          onClick={requestRefresh}
          className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
          aria-label="Refresh preview"
        >
          <RotateCw size={14} />
        </button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 min-h-0">
        {hasContent ? (
          previewType === 'html' ? (
            <iframe
              srcDoc={previewContent}
              sandbox="allow-scripts"
              title="Preview"
              className="w-full h-full border-0 bg-white"
            />
          ) : previewType === 'svg' ? (
            <div
              className="w-full h-full flex items-center justify-center bg-white p-4 overflow-auto"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          ) : (
            <pre className="w-full h-full overflow-auto p-4 text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)]">
              {previewContent}
            </pre>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--text-muted)] select-none">
              Preview will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
