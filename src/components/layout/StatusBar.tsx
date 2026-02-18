import { useEditorStore } from '../../store/editorStore';
import { getLanguageLabel } from '../../lib/languageDetect';

export default function StatusBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <footer className="h-6 flex items-center justify-between px-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-xs text-[var(--text-muted)] select-none shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {activeTab ? (
          <>
            <span>{getLanguageLabel(activeTab.language)}</span>
            <span>
              Ln {activeTab.cursorPosition.line}, Col {activeTab.cursorPosition.col}
            </span>
          </>
        ) : (
          <span>No file open</span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <span>UTF-8</span>
        <span>Python 3.x</span>
      </div>
    </footer>
  );
}
