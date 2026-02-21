import { RotateCw, Eye, Loader2, Play } from 'lucide-react';
import { useExecutionStore } from '../../store/executionStore';

function looksLikeHtml(output: string): boolean {
  const trimmed = output.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function PythonPreview() {
  const pythonOutput = useExecutionStore((s) => s.pythonOutput);
  const pythonOutputReady = useExecutionStore((s) => s.pythonOutputReady);
  const isRunning = useExecutionStore((s) => s.isRunning);

  const hasOutput = pythonOutput.length > 0;

  if (isRunning && !hasOutput) {
    return (
      <div className="flex items-center justify-center h-full gap-2">
        <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-muted)] select-none">Running...</p>
      </div>
    );
  }

  if (!hasOutput) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Play size={20} className="text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)] select-none">
          Run to see preview
        </p>
      </div>
    );
  }

  if (pythonOutputReady && looksLikeHtml(pythonOutput)) {
    return (
      <iframe
        srcDoc={pythonOutput}
        sandbox="allow-scripts"
        title="Python HTML Output"
        className="w-full h-full border-0 bg-white"
      />
    );
  }

  return (
    <pre className="w-full h-full overflow-auto p-4 text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-primary)] whitespace-pre-wrap break-words">
      {pythonOutput}
      {isRunning && (
        <span className="inline-block ml-1 w-1.5 h-3.5 bg-[var(--accent)] animate-pulse" />
      )}
    </pre>
  );
}

export default function PreviewPane() {
  const previewContent = useExecutionStore((s) => s.previewContent);
  const previewType = useExecutionStore((s) => s.previewType);
  const previewUrl = useExecutionStore((s) => s.previewUrl);
  const requestRefresh = useExecutionStore((s) => s.requestRefresh);

  const hasContent =
    previewType !== 'none' && previewType !== 'python' && previewType !== 'url' && previewContent.length > 0;

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
        {previewType === 'python' ? (
          <PythonPreview />
        ) : previewType === 'url' && previewUrl ? (
          <iframe src={previewUrl} title="Python App Preview" className="w-full h-full border-0 bg-white" />
        ) : previewType === 'url' ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--text-muted)] select-none">
              Waiting for app server...
            </p>
          </div>
        ) : hasContent ? (
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
