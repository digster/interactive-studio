import { X, FileCode, FileText, FileJson, FileImage } from 'lucide-react';
import { useEditorStore, type EditorTab } from '../../store/editorStore';
import clsx from 'clsx';

function getFileIcon(language: string) {
  switch (language) {
    case 'javascript':
    case 'typescript':
    case 'jsx':
    case 'tsx':
    case 'python':
    case 'rust':
    case 'html':
    case 'css':
    case 'shell':
      return FileCode;
    case 'json':
      return FileJson;
    case 'svg':
      return FileImage;
    default:
      return FileText;
  }
}

interface TabItemProps {
  tab: EditorTab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
}

function TabItem({ tab, isActive, onActivate, onClose }: TabItemProps) {
  const Icon = getFileIcon(tab.language);

  return (
    <div
      role="tab"
      aria-selected={isActive}
      className={clsx(
        'group flex items-center gap-1.5 px-3 h-full text-sm cursor-pointer border-r border-[var(--border)] transition-colors duration-100 shrink-0',
        isActive
          ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent)]'
          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border-b-2 border-b-transparent'
      )}
      onClick={onActivate}
    >
      <Icon size={14} className="shrink-0 text-[var(--text-muted)]" />

      {/* Modified indicator */}
      {tab.isModified && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
      )}

      <span className="truncate max-w-[120px]">{tab.name}</span>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={clsx(
          'p-0.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors duration-100 shrink-0',
          isActive
            ? 'opacity-60 hover:opacity-100'
            : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
        )}
        aria-label={`Close ${tab.name}`}
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function TabBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);

  return (
    <div
      role="tablist"
      className="h-9 flex items-stretch bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-x-auto shrink-0"
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onActivate={() => setActiveTab(tab.id)}
          onClose={() => closeTab(tab.id)}
        />
      ))}
    </div>
  );
}
