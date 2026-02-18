import { Trash2 } from 'lucide-react';
import { useExecutionStore, type ConsoleEntry } from '../../store/executionStore';
import { useUIStore } from '../../store/uiStore';
import clsx from 'clsx';

function entryColor(type: ConsoleEntry['type']): string {
  switch (type) {
    case 'error':
      return 'text-[var(--error)]';
    case 'warn':
      return 'text-[var(--warning)]';
    case 'info':
      return 'text-[var(--accent)]';
    case 'result':
      return 'text-[var(--success)]';
    case 'log':
    default:
      return 'text-[var(--text-secondary)]';
  }
}

function entryPrefix(type: ConsoleEntry['type']): string {
  switch (type) {
    case 'error':
      return '[ERR]';
    case 'warn':
      return '[WRN]';
    case 'info':
      return '[INF]';
    case 'result':
      return '[RES]';
    case 'log':
    default:
      return '[LOG]';
  }
}

export default function ConsolePanel() {
  const consoleEntries = useExecutionStore((s) => s.consoleEntries);
  const clearConsole = useExecutionStore((s) => s.clearConsole);
  const activeTab = useUIStore((s) => s.bottomPanelActiveTab);
  const setActiveTab = useUIStore((s) => s.setBottomPanelActiveTab);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Tab Bar */}
      <div className="h-9 flex items-center justify-between px-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('console')}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded transition-colors duration-100',
              activeTab === 'console'
                ? 'text-[var(--text-primary)] bg-[var(--bg-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            Console
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={clsx(
              'px-3 py-1 text-xs font-medium rounded transition-colors duration-100',
              activeTab === 'problems'
                ? 'text-[var(--text-primary)] bg-[var(--bg-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            Problems
          </button>
        </div>

        <button
          onClick={clearConsole}
          className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
          aria-label="Clear console"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'console' ? (
          consoleEntries.length > 0 ? (
            <div className="p-2 space-y-0.5">
              {consoleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={clsx(
                    'font-mono text-xs leading-5 px-2 py-0.5 rounded hover:bg-[var(--surface-hover)] transition-colors duration-100',
                    entryColor(entry.type)
                  )}
                >
                  <span className="opacity-50 mr-2 select-none">
                    {entryPrefix(entry.type)}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{entry.content}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-[var(--text-muted)] select-none">
                No console output
              </p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-[var(--text-muted)] select-none">
              No problems detected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
