import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { type FileNode, useWorkspaceStore } from '../../store/workspaceStore';
import { useEditorStore } from '../../store/editorStore';
import { getFileIcon, getFolderIcon, getFileIconColor } from '../../lib/fileIcons';
import { detectLanguage } from '../../lib/languageDetect';
import { readFile } from '../../lib/tauriFS';

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

export default function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const expandedDirs = useWorkspaceStore((s) => s.expandedDirs);
  const toggleDir = useWorkspaceStore((s) => s.toggleDir);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const openFile = useEditorStore((s) => s.openFile);

  const isExpanded = expandedDirs.has(node.path);
  const isActive = node.path === activeTabId;

  const sortedChildren = useMemo(() => {
    if (!node.children) return [];
    return [...node.children].sort((a, b) => {
      if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
      return a.isDir ? -1 : 1;
    });
  }, [node.children]);

  const handleClick = async () => {
    if (node.isDir) {
      toggleDir(node.path);
    } else {
      try {
        const content = await readFile(node.path);
        const language = detectLanguage(node.name);
        openFile(node.path, node.name, content, language);
      } catch (err) {
        console.error('Failed to open file:', err);
      }
    }
  };

  if (node.isDir) {
    const FolderIcon = getFolderIcon(isExpanded);
    return (
      <div role="treeitem" aria-expanded={isExpanded}>
        <button
          onClick={handleClick}
          className="h-7 flex items-center w-full text-left text-sm cursor-pointer hover:bg-[var(--surface-hover)] transition-colors select-none"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <ChevronRight
            size={14}
            className={clsx(
              'shrink-0 text-[var(--text-muted)] transition-transform duration-150 mr-1',
              isExpanded && 'rotate-90',
            )}
          />
          <FolderIcon size={14} className="shrink-0 text-[var(--accent)] mr-1.5" />
          <span className="truncate text-[var(--text-secondary)]">{node.name}</span>
        </button>

        {/* Animated children container */}
        <div
          className="grid transition-[grid-template-rows] duration-150"
          style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            {sortedChildren.map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const FileIcon = getFileIcon(node.name);
  const iconColor = getFileIconColor(node.name);

  return (
    <div role="treeitem">
      <button
        onClick={handleClick}
        className={clsx(
          'h-7 flex items-center w-full text-left text-sm cursor-pointer hover:bg-[var(--surface-hover)] transition-colors select-none',
          isActive && 'bg-[var(--accent)]/10 text-[var(--text-primary)]',
        )}
        style={{ paddingLeft: `${12 + depth * 16 + 20}px` }}
      >
        <FileIcon size={14} className={clsx('shrink-0 mr-1.5', iconColor)} />
        <span className={clsx('truncate', isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}>
          {node.name}
        </span>
      </button>
    </div>
  );
}
