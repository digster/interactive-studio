import { Folder } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import FileTree from '../filetree/FileTree';

export default function Sidebar() {
  const activeProject = useWorkspaceStore((s) => s.activeProject);

  return (
    <aside className="h-full flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 shrink-0">
        <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--text-muted)]">
          Explorer
        </span>
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
          <FileTree />
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
