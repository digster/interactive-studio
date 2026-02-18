import { useMemo, useState, useCallback } from 'react';
import { ChevronRight, FilePlus, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { type FileNode, useWorkspaceStore } from '../../store/workspaceStore';
import { useEditorStore } from '../../store/editorStore';
import { getFileIcon, getFolderIcon, getFileIconColor } from '../../lib/fileIcons';
import { detectLanguage } from '../../lib/languageDetect';
import { readFile } from '../../lib/tauriFS';
import { useFileOperations } from '../../hooks/useFileOperations';
import ContextMenu, { type ContextMenuItem } from '../ui/ContextMenu';
import ConfirmDialog from '../ui/ConfirmDialog';
import InlineInput from '../ui/InlineInput';

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

type InlineMode = 'newFile' | 'newFolder' | 'rename' | null;

export default function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const expandedDirs = useWorkspaceStore((s) => s.expandedDirs);
  const toggleDir = useWorkspaceStore((s) => s.toggleDir);
  const expandDir = useWorkspaceStore((s) => s.expandDir);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const openFile = useEditorStore((s) => s.openFile);
  const { createNewFile, createNewFolder, deleteFile, renameFile } = useFileOperations();

  const isExpanded = expandedDirs.has(node.path);
  const isActive = node.path === activeTabId;

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [inlineMode, setInlineMode] = useState<InlineMode>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleRenameSubmit = useCallback(
    async (newName: string) => {
      if (newName === node.name) {
        setInlineMode(null);
        return;
      }
      const parts = node.path.split('/');
      parts.pop();
      const newPath = `${parts.join('/')}/${newName}`;
      await renameFile(node.path, newPath);
      setInlineMode(null);
    },
    [node.path, node.name, renameFile],
  );

  const handleNewFileSubmit = useCallback(
    async (name: string) => {
      await createNewFile(node.path, name);
      setInlineMode(null);
    },
    [node.path, createNewFile],
  );

  const handleNewFolderSubmit = useCallback(
    async (name: string) => {
      await createNewFolder(node.path, name);
      setInlineMode(null);
    },
    [node.path, createNewFolder],
  );

  const handleDelete = useCallback(async () => {
    await deleteFile(node.path);
    setShowDeleteConfirm(false);
  }, [node.path, deleteFile]);

  const getContextMenuItems = (): ContextMenuItem[] => {
    if (node.isDir) {
      return [
        {
          label: 'New File',
          icon: FilePlus,
          onClick: () => {
            expandDir(node.path);
            setInlineMode('newFile');
          },
        },
        {
          label: 'New Folder',
          icon: FolderPlus,
          onClick: () => {
            expandDir(node.path);
            setInlineMode('newFolder');
          },
        },
        { label: '', separator: true, onClick: () => {} },
        {
          label: 'Rename',
          icon: Pencil,
          onClick: () => setInlineMode('rename'),
        },
        {
          label: 'Delete',
          icon: Trash2,
          danger: true,
          onClick: () => setShowDeleteConfirm(true),
        },
      ];
    }

    return [
      {
        label: 'Rename',
        icon: Pencil,
        onClick: () => setInlineMode('rename'),
      },
      {
        label: 'Delete',
        icon: Trash2,
        danger: true,
        onClick: () => setShowDeleteConfirm(true),
      },
    ];
  };

  // Render inline input for rename
  if (inlineMode === 'rename') {
    const indent = node.isDir ? 12 + depth * 16 : 12 + depth * 16 + 20;
    return (
      <div className="h-7 flex items-center" style={{ paddingLeft: `${indent}px` }}>
        <InlineInput
          defaultValue={node.name}
          selectNameOnly={!node.isDir}
          onSubmit={handleRenameSubmit}
          onCancel={() => setInlineMode(null)}
        />
      </div>
    );
  }

  if (node.isDir) {
    const FolderIcon = getFolderIcon(isExpanded);
    return (
      <div role="treeitem" aria-expanded={isExpanded}>
        <button
          onClick={handleClick}
          onContextMenu={handleContextMenu}
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
            {/* Inline input for new file/folder at top of children */}
            {(inlineMode === 'newFile' || inlineMode === 'newFolder') && (
              <div
                className="h-7 flex items-center"
                style={{ paddingLeft: `${12 + (depth + 1) * 16 + 20}px` }}
              >
                <InlineInput
                  placeholder={inlineMode === 'newFile' ? 'filename' : 'folder name'}
                  onSubmit={inlineMode === 'newFile' ? handleNewFileSubmit : handleNewFolderSubmit}
                  onCancel={() => setInlineMode(null)}
                />
              </div>
            )}
            {sortedChildren.map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={getContextMenuItems()}
            onClose={() => setContextMenu(null)}
          />
        )}

        {showDeleteConfirm && (
          <ConfirmDialog
            title={`Delete "${node.name}"?`}
            message="This will permanently delete this folder and all its contents."
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    );
  }

  const FileIcon = getFileIcon(node.name);
  const iconColor = getFileIconColor(node.name);

  return (
    <div role="treeitem">
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title={`Delete "${node.name}"?`}
          message="This will permanently delete this file. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
