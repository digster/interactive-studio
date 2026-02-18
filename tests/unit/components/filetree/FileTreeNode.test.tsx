import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileTreeNode from '../../../../src/components/filetree/FileTreeNode';
import { useWorkspaceStore } from '../../../../src/store/workspaceStore';
import { useEditorStore } from '../../../../src/store/editorStore';

// Mock tauriFS to avoid Tauri invoke calls
vi.mock('../../../../src/lib/tauriFS', () => ({
  readFile: vi.fn().mockResolvedValue('file content'),
}));

describe('FileTreeNode', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      expandedDirs: new Set<string>(),
    });
    useEditorStore.setState({
      tabs: [],
      activeTabId: null,
    });
  });

  it('should render a file node', () => {
    const node = { name: 'main.ts', path: '/project/main.ts', isDir: false };
    render(<FileTreeNode node={node} depth={0} />);
    expect(screen.getByText('main.ts')).toBeInTheDocument();
  });

  it('should render a folder node', () => {
    const node = {
      name: 'src',
      path: '/project/src',
      isDir: true,
      children: [],
    };
    render(<FileTreeNode node={node} depth={0} />);
    expect(screen.getByText('src')).toBeInTheDocument();
  });

  it('should have treeitem role', () => {
    const node = { name: 'main.ts', path: '/project/main.ts', isDir: false };
    const { container } = render(<FileTreeNode node={node} depth={0} />);
    expect(container.querySelector('[role="treeitem"]')).toBeInTheDocument();
  });

  it('should toggle directory expansion on click', () => {
    const node = {
      name: 'src',
      path: '/project/src',
      isDir: true,
      children: [
        { name: 'index.ts', path: '/project/src/index.ts', isDir: false },
      ],
    };
    render(<FileTreeNode node={node} depth={0} />);
    fireEvent.click(screen.getByText('src'));
    expect(useWorkspaceStore.getState().expandedDirs.has('/project/src')).toBe(true);
  });

  it('should open file on click', async () => {
    const node = { name: 'app.tsx', path: '/project/app.tsx', isDir: false };
    render(<FileTreeNode node={node} depth={0} />);
    fireEvent.click(screen.getByText('app.tsx'));

    // Wait for the async readFile to complete
    await waitFor(() => {
      expect(useEditorStore.getState().tabs).toHaveLength(1);
      expect(useEditorStore.getState().tabs[0].name).toBe('app.tsx');
    });
  });

  it('should sort directories before files', () => {
    const node = {
      name: 'root',
      path: '/root',
      isDir: true,
      children: [
        { name: 'zebra.ts', path: '/root/zebra.ts', isDir: false },
        { name: 'alpha', path: '/root/alpha', isDir: true, children: [] },
        { name: 'apple.ts', path: '/root/apple.ts', isDir: false },
        { name: 'beta', path: '/root/beta', isDir: true, children: [] },
      ],
    };

    // Expand the dir so children are visible
    useWorkspaceStore.setState({
      expandedDirs: new Set(['/root']),
    });

    const { container } = render(<FileTreeNode node={node} depth={0} />);
    const buttons = container.querySelectorAll('button');
    // First button is the root folder itself
    // Then sorted: alpha (dir), beta (dir), apple.ts (file), zebra.ts (file)
    const names = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(names).toEqual(['root', 'alpha', 'beta', 'apple.ts', 'zebra.ts']);
  });

  it('should show aria-expanded on directory nodes', () => {
    const node = {
      name: 'src',
      path: '/project/src',
      isDir: true,
      children: [],
    };
    const { container } = render(<FileTreeNode node={node} depth={0} />);
    const treeitem = container.querySelector('[role="treeitem"]');
    expect(treeitem).toHaveAttribute('aria-expanded', 'false');
  });
});
