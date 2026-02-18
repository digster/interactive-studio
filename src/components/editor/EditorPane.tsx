import { FileText } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import TabBar from './TabBar';
import CodeEditor from './CodeEditor';

export default function EditorPane() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Tab Bar */}
      {tabs.length > 0 && <TabBar />}

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
