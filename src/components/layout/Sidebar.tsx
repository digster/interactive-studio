import { useState } from 'react';
import { Folder, FilePlus, FolderPlus } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useFileOperations } from '../../hooks/useFileOperations';
import FileTree from '../filetree/FileTree';
import InlineInput from '../ui/InlineInput';

export default function Sidebar() {
  const activeProject = useWorkspaceStore((s) => s.activeProject);
  const { createNewFile, createNewFolder } = useFileOperations();
  const [inlineMode, setInlineMode] = useState<'newFile' | 'newFolder' | null>(null);

  const handleNewFile = async (name: string) => {
    if (!activeProject) return;
    await createNewFile(activeProject.path, name);
    setInlineMode(null);
  };

  const handleNewFolder = async (name: string) => {
    if (!activeProject) return;
    await createNewFolder(activeProject.path, name);
    setInlineMode(null);
  };

  return (
    <aside className="h-full flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 shrink-0 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--text-muted)]">
          Explorer
        </span>
        {activeProject && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setInlineMode('newFile')}
              className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
              aria-label="New file"
              title="New File"
            >
              <FilePlus size={14} />
            </button>
            <button
              onClick={() => setInlineMode('newFolder')}
              className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-150"
              aria-label="New folder"
              title="New Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Project Name */}
      {activeProject && (
        <div className="flex items-center gap-2 px-4 py-1.5 text-sm text-[var(--text-secondary)]">
          <Folder size={14} className="text-[var(--accent)] shrink-0" />
          <span className="truncate font-medium">{activeProject.name}</span>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto px-1">
        {activeProject ? (
          <>
            {inlineMode && (
              <div className="h-7 flex items-center px-3">
                <InlineInput
                  placeholder={inlineMode === 'newFile' ? 'filename' : 'folder name'}
                  onSubmit={inlineMode === 'newFile' ? handleNewFile : handleNewFolder}
                  onCancel={() => setInlineMode(null)}
                />
              </div>
            )}
            <FileTree />
          </>
        ) : (
          <div className="flex items-center justify-center h-full px-4">
            <p className="text-sm text-[var(--text-muted)] text-center">
              No project open
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
