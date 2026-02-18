import { useWorkspaceStore } from '../../store/workspaceStore';
import FileTreeNode from './FileTreeNode';

export default function FileTree() {
  const fileTree = useWorkspaceStore((s) => s.fileTree);

  if (fileTree.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-[var(--text-muted)]">
        No files found
      </div>
    );
  }

  return (
    <div role="tree" className="py-1">
      {fileTree.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
}
