import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FileTree from '../../../../src/components/filetree/FileTree';
import { useWorkspaceStore } from '../../../../src/store/workspaceStore';

describe('FileTree', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      fileTree: [],
      expandedDirs: new Set<string>(),
    });
  });

  it('should show empty state when fileTree is empty', () => {
    render(<FileTree />);
    expect(screen.getByText('No files found')).toBeInTheDocument();
  });

  it('should render nodes when fileTree has entries', () => {
    useWorkspaceStore.setState({
      fileTree: [
        { name: 'index.html', path: '/project/index.html', isDir: false },
        { name: 'style.css', path: '/project/style.css', isDir: false },
      ],
    });
    render(<FileTree />);
    expect(screen.getByText('index.html')).toBeInTheDocument();
    expect(screen.getByText('style.css')).toBeInTheDocument();
  });

  it('should have tree accessibility role', () => {
    useWorkspaceStore.setState({
      fileTree: [
        { name: 'main.js', path: '/project/main.js', isDir: false },
      ],
    });
    const { container } = render(<FileTree />);
    expect(container.querySelector('[role="tree"]')).toBeInTheDocument();
  });
});
