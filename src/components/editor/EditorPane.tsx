import { useEffect } from 'react';
import { FileText, Play, Loader2 } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useExecutionStore } from '../../store/executionStore';
import { isExecutable } from '../../lib/languageDetect';
import { useCodeExecution } from '../../hooks/useCodeExecution';
import TabBar from './TabBar';
import CodeEditor from './CodeEditor';

export default function EditorPane() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const { execute } = useCodeExecution();

  const showToolbar = activeTab && isExecutable(activeTab.language);

  // Cmd+Enter shortcut to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        execute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [execute]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Tab Bar */}
      {tabs.length > 0 && <TabBar />}

      {/* Run Toolbar */}
      {showToolbar && (
        <div className="h-8 flex items-center px-3 gap-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] shrink-0">
          <button
            onClick={execute}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-[var(--success)]/15 text-[var(--success)] hover:bg-[var(--success)]/25 disabled:opacity-50 transition-colors duration-150"
            aria-label="Run code"
          >
            {isRunning ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Play size={13} className="fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>
          <span className="text-[11px] text-[var(--text-muted)]">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
          </span>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab ? (
          <CodeEditor
            key={activeTab.id}
            content={activeTab.content}
            language={activeTab.language}
            tabId={activeTab.id}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
            <FileText size={40} className="text-[var(--text-muted)] opacity-40" />
            <p className="text-sm text-[var(--text-muted)]">
              Open a file to start editing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
