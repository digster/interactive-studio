import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('../../../../src/lib/tauriFS', () => ({
  createProject: vi.fn(),
  writeFile: vi.fn(),
  listProjects: vi.fn(),
  readFile: vi.fn(),
}));

import NewProjectDialog from '../../../../src/components/project/NewProjectDialog';
import { useWorkspaceStore } from '../../../../src/store/workspaceStore';

describe('NewProjectDialog', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      workspacePath: '/home/user/workspace',
      projects: [
        { name: 'existing-project', path: '/home/user/workspace/existing-project' },
      ],
      activeProject: null,
      fileTree: [],
      expandedDirs: new Set(),
    });
  });

  it('should render the dialog with title', () => {
    render(<NewProjectDialog onClose={onClose} />);
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('should render template options', () => {
    render(<NewProjectDialog onClose={onClose} />);
    expect(screen.getByText('Blank')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Mermaid')).toBeInTheDocument();
  });

  it('should show validation error for empty name when Enter is pressed', () => {
    render(<NewProjectDialog onClose={onClose} />);
    // Name input is empty by default; press Enter to trigger validation
    const input = screen.getByPlaceholderText('my-project');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Project name is required')).toBeInTheDocument();
  });

  it('should show validation error for invalid characters', () => {
    render(<NewProjectDialog onClose={onClose} />);
    const input = screen.getByPlaceholderText('my-project');
    fireEvent.change(input, { target: { value: 'my project!' } });
    fireEvent.click(screen.getByText('Create Project'));
    expect(screen.getByText('Only letters, numbers, hyphens, and underscores')).toBeInTheDocument();
  });

  it('should show validation error for duplicate project name', () => {
    render(<NewProjectDialog onClose={onClose} />);
    const input = screen.getByPlaceholderText('my-project');
    fireEvent.change(input, { target: { value: 'existing-project' } });
    fireEvent.click(screen.getByText('Create Project'));
    expect(screen.getByText('Project already exists')).toBeInTheDocument();
  });

  it('should change selected template when clicked', () => {
    render(<NewProjectDialog onClose={onClose} />);
    // Default is HTML; click Python
    const pythonButton = screen.getByText('Python').closest('button')!;
    fireEvent.click(pythonButton);
    // The Python button should now have the selected style (accent border)
    expect(pythonButton.className).toContain('border-[var(--accent)]');
  });

  it('should call onClose when close button is clicked', () => {
    render(<NewProjectDialog onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<NewProjectDialog onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should close on Escape key', () => {
    render(<NewProjectDialog onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render project name input with placeholder', () => {
    render(<NewProjectDialog onClose={onClose} />);
    expect(screen.getByPlaceholderText('my-project')).toBeInTheDocument();
  });

  it('should clear error when user types in the input', () => {
    render(<NewProjectDialog onClose={onClose} />);
    // Trigger validation error by pressing Enter with empty name
    const input = screen.getByPlaceholderText('my-project');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Project name is required')).toBeInTheDocument();

    // Type something - error should clear
    fireEvent.change(input, { target: { value: 'n' } });
    expect(screen.queryByText('Project name is required')).not.toBeInTheDocument();
  });

  it('should disable Create button when name is empty', () => {
    render(<NewProjectDialog onClose={onClose} />);
    const createButton = screen.getByText('Create Project');
    expect(createButton).toBeDisabled();
  });

  it('should enable Create button when name is provided', () => {
    render(<NewProjectDialog onClose={onClose} />);
    const input = screen.getByPlaceholderText('my-project');
    fireEvent.change(input, { target: { value: 'new-project' } });
    const createButton = screen.getByText('Create Project');
    expect(createButton).not.toBeDisabled();
  });
});
