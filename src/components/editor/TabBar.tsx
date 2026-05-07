import { useState, type DragEvent } from 'react';
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
  index: number;
  isActive: boolean;
  isDropTarget: boolean;
  onActivate: () => void;
  onClose: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: () => void;
}

function TabItem({
  tab,
  index,
  isActive,
  isDropTarget,
  onActivate,
  onClose,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: TabItemProps) {
  const Icon = getFileIcon(tab.language);

  return (
    <div className="relative flex h-full shrink-0 items-stretch">
      {/* Drop indicator: 2px vertical bar shown on the leading edge of the
          target tab while a drag hovers over it. Uses --accent to match
          the active tab underline visual. */}
      {isDropTarget && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-px top-0 z-10 h-full w-0.5 bg-[var(--accent)]"
        />
      )}
      <div
        role="tab"
        aria-selected={isActive}
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={(e) => onDragOver(e, index)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, index)}
        onDragEnd={onDragEnd}
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
    </div>
  );
}

export default function TabBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const reorderTabs = useEditorStore((s) => s.reorderTabs);

  // Transient UI state for the drop indicator. Kept local because it has no
  // meaning outside the in-progress drag interaction.
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    // Required to allow a drop event to fire — the default behavior is to
    // reject drops, so without preventDefault() the onDrop handler never runs.
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const fromIndex = Number.parseInt(raw, 10);
    setDragOverIndex(null);
    if (Number.isNaN(fromIndex)) return;
    reorderTabs(fromIndex, toIndex);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
  };

  return (
    <div
      role="tablist"
      className="h-9 flex items-stretch bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-x-auto shrink-0"
    >
      {tabs.map((tab, index) => (
        <TabItem
          key={tab.id}
          tab={tab}
          index={index}
          isActive={tab.id === activeTabId}
          isDropTarget={dragOverIndex === index}
          onActivate={() => setActiveTab(tab.id)}
          onClose={() => closeTab(tab.id)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
