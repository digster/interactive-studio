import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from '../../../../src/components/layout/Sidebar';
import { useWorkspaceStore } from '../../../../src/store/workspaceStore';

describe('Sidebar', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ activeProject: null });
  });

  it('should show "No project open" when no project is active', () => {
    render(<Sidebar />);
    expect(screen.getByText('No project open')).toBeInTheDocument();
  });

  it('should show the Explorer header', () => {
    render(<Sidebar />);
    expect(screen.getByText('Explorer')).toBeInTheDocument();
  });

  it('should show project name when a project is active', () => {
    useWorkspaceStore.setState({
      activeProject: { name: 'Test Project', path: '/test' },
    });
    render(<Sidebar />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should show file tree when project is active', () => {
    useWorkspaceStore.setState({
      activeProject: { name: 'Test Project', path: '/test' },
      fileTree: [],
    });
    render(<Sidebar />);
    // FileTree renders "No files found" for an empty tree
    expect(screen.getByText('No files found')).toBeInTheDocument();
  });
});
